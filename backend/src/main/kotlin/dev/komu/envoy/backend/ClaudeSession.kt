package dev.komu.envoy.backend

import com.anthropic.client.okhttp.AnthropicOkHttpClientAsync
import com.anthropic.helpers.MessageAccumulator
import com.anthropic.models.messages.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory

class ClaudeSession {

    private val client = AnthropicOkHttpClientAsync.fromEnv()

    private val params = MessageCreateParams.builder()
        .maxTokens(1024)
        .model(Model.CLAUDE_3_7_SONNET_LATEST)
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

    suspend fun message(message: String, session: DefaultWebSocketServerSession) {
        log.info("send message: {}", message)

        params.addUserMessage(message)

        do {
            val messageAccumulator = MessageAccumulator.create()
            client.messages()
                .createStreaming(params.build())
                .asFlow().collect { event ->
                    messageAccumulator.accumulate(event)
                    val deltaText = event.contentBlockDelta?.deltaText
                    if (deltaText != null)
                        session.send(DeltaMessage(deltaText))
                }

            val result = messageAccumulator.message()
            log.info("receive message: {}", result)
            params.addMessage(result)

            for (b in result.content()) {
                when (val block = b.asContentBlockType()) {
                    is ContentBlockType.Text ->
                        session.send(AssistantMessage(block.text))

                    is ContentBlockType.ToolUse -> {
                        session.send(ToolCallMessage("Calling ${block.name} with input ${block.input}"))

                        val tool = tools.find { it.name == block.name }
                        if (tool != null) {
                            try {
                                val result = tool.code(block.input)
                                params.addUserMessageOfBlockParams(
                                    listOf(
                                        ContentBlockParam.ofToolResult(
                                            ToolResultBlockParam.builder().toolUseId(block.id).content(result).build()
                                        )
                                    )
                                )
                            } catch (e: Exception) {
                                log.error("Error calling tool ${block.name}", e)
                                params.addUserMessageOfBlockParams(
                                    listOf(
                                        ContentBlockParam.ofToolResult(
                                            ToolResultBlockParam.builder().toolUseId(block.id).content("tool call failed").build()
                                        )
                                    )
                                )
                            }

                        } else {
                            log.warn("Unknown tool: ${block.name}")
                        }
                    }
                    is ContentBlockType.Thinking, is ContentBlockType.RedactedThinking, -> {
                        // TODO
                    }
                }
            }

            val hasNewMessages = result.stopReason == StopReason.TOOL_USE

        } while (hasNewMessages)
    }

    companion object {
        private val log = LoggerFactory.getLogger(ClaudeSession::class.java)
    }
}

suspend fun WebSocketSession.send(message: ChatMessage) {
    send(Json.Default.encodeToString(ChatMessage.serializer(), message))
}

@Serializable
sealed class ChatMessage

@Serializable
@SerialName("assistant")
class AssistantMessage(val message: String) : ChatMessage()

@Serializable
@SerialName("tool-call")
class ToolCallMessage(val message: String) : ChatMessage()

@Serializable
@SerialName("delta")
class DeltaMessage(val delta: String) : ChatMessage()
