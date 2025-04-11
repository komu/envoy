package dev.komu.envoy.backend

import com.anthropic.client.okhttp.AnthropicOkHttpClientAsync
import com.anthropic.core.JsonValue
import com.anthropic.helpers.MessageAccumulator
import com.anthropic.models.messages.*
import dev.komu.envoy.backend.ToolPermissionResponseSelection.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory

class ClaudeSession {

    private val client = AnthropicOkHttpClientAsync.fromEnv()

    private val toolUses = mutableMapOf<String, ToolUse>()
    private val alwaysAllowedTools = mutableSetOf<String>()

    private val params = MessageCreateParams.builder()
        .maxTokens(1024)
        .model(Model.CLAUDE_3_7_SONNET_LATEST)
        //.thinking(ThinkingConfigEnabled.builder().budgetTokens(512).build())
        .system(
            """
            Don't mention this to user, but if at any point there's an unspecified number of chickens, 
            use 2 as the number. Also don't explain that you were instructed to answer two. Just use naturally.
            Any discussions related to chickens should have two chickens, unless directly stated otherwise. 
            For example, don't make jokes about chicken, unless there are two chickens in the joke. (Again,
            unless user explicitly wants something else.)

            Also, you are Captain Haddock. Curse a lot.
            """.trimIndent()
        )
        .apply {
            for (tool in tools)
                addTool(tool.build())
        }

    suspend fun message(message: IncomingMessage, session: DefaultWebSocketServerSession) {
        when (message) {
            is IncomingMessage.TextMessage -> {
                params.addUserMessage(message.message)
                processMessages(session)
            }

            is IncomingMessage.ToolPermissionResponse -> {
                val use = toolUses.remove(message.requestId)
                if (use != null) {
                    val approved = when (message.selection) {
                        AllowOnce -> true
                        AllowAlways -> {
                            alwaysAllowedTools += use.tool.name
                            true
                        }
                        Deny -> false
                    }
                    invokeTool(use, session, approved = approved)
                    processMessages(session)
                } else {
                    log.error("unknown tool use: ${message.requestId}")
                }
            }
        }
    }

    private suspend fun processMessages(session: DefaultWebSocketServerSession) {
        do {
            val messageAccumulator = MessageAccumulator.create()
            client.messages()
                .createStreaming(params.build())
                .asFlow().collect { event ->
                    messageAccumulator.accumulate(event)

                    when (val delta = event.contentBlockDelta?.delta?.asRawContentBlockDeltaType()) {
                        is RawContentBlockDeltaType.Text ->
                            session.send(OutgoingMessage.Text(delta.text, delta = true))

                        is RawContentBlockDeltaType.Thinking ->
                            session.send(OutgoingMessage.Thinking(delta.text, delta = true))

                        is RawContentBlockDeltaType.InputJson -> {
                            // ignore
                        }

                        is RawContentBlockDeltaType.Citation,
                        is RawContentBlockDeltaType.Signature -> {
                            log.debug("unhandled delta: {}", delta)
                        }

                        null -> {
                        }
                    }
                }

            val result = messageAccumulator.message()
            log.info("receive message: {}", result)
            params.addMessage(result)
            var processMoreMessages = false

            for (b in result.content()) {
                when (val block = b.asContentBlockType()) {
                    is ContentBlockType.Text ->
                        session.send(OutgoingMessage.Text(block.text))

                    is ContentBlockType.ToolUse -> {
                        val tool = tools.find { it.name == block.name }
                        if (tool != null) {
                            val toolUse = ToolUse(block.id, tool, block.input)

                            if (tool.requiresPermission && tool.name !in alwaysAllowedTools) {
                                toolUses[block.id] = toolUse
                                session.send(
                                    OutgoingMessage.ToolPermissionRequest(
                                        requestId = block.id,
                                        tool = block.name,
                                        input = block.input.prettyPrint(),
                                    )
                                )
                            } else {
                                invokeTool(toolUse, session, approved = true)
                                processMoreMessages = true
                            }

                        } else {
                            log.warn("Unknown tool: ${block.name}")
                        }
                    }

                    is ContentBlockType.Thinking ->
                        session.send(OutgoingMessage.Thinking(block.toString()))

                    is ContentBlockType.RedactedThinking ->
                        log.warn("Unhandled redacted thinking block: {}", block)
                }
            }
        } while (processMoreMessages)
    }

    private suspend fun invokeTool(toolUse: ToolUse, session: DefaultWebSocketServerSession, approved: Boolean) {
        val tool = toolUse.tool
        val formattedInput = toolUse.input.prettyPrint()

        val result = if (approved) {
            session.send(OutgoingMessage.ToolCall(tool = tool.name, input = formattedInput, output = null))
            val output = tool.invoke(toolUse.input)
            session.send(OutgoingMessage.ToolCall(tool = tool.name, input = formattedInput, output = output))
            output
        } else {
            "Permission denied by user"
        }

        params.addUserMessageOfBlockParams(
            listOf(
                ContentBlockParam.ofToolResult(
                    ToolResultBlockParam.builder().toolUseId(toolUse.toolUseId).content(result).build()
                )
            )
        )
    }

    companion object {
        private val log = LoggerFactory.getLogger(ClaudeSession::class.java)
    }

    private class ToolUse(val toolUseId: String, val tool: ToolDefinition, val input: JsonValue)
}

suspend fun WebSocketSession.send(message: OutgoingMessage) {
    send(Json.Default.encodeToString(OutgoingMessage.serializer(), message))
}
