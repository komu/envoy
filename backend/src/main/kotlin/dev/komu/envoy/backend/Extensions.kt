package dev.komu.envoy.backend

import com.anthropic.core.JsonValue
import com.anthropic.core.http.AsyncStreamResponse
import com.anthropic.models.messages.CitationsDelta
import com.anthropic.models.messages.ContentBlock
import com.anthropic.models.messages.InputJsonDelta
import com.anthropic.models.messages.Message
import com.anthropic.models.messages.RawContentBlockDelta
import com.anthropic.models.messages.RawContentBlockDeltaEvent
import com.anthropic.models.messages.RawMessageStreamEvent
import com.anthropic.models.messages.RedactedThinkingBlock
import com.anthropic.models.messages.SignatureDelta
import com.anthropic.models.messages.StopReason
import com.anthropic.models.messages.TextBlock
import com.anthropic.models.messages.TextDelta
import com.anthropic.models.messages.ThinkingBlock
import com.anthropic.models.messages.ThinkingDelta
import com.anthropic.models.messages.ToolUseBlock
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.util.*
import kotlin.jvm.optionals.getOrNull

/**
 * Extension function to convert AsyncStreamResponse to Flow
 */
fun <T> AsyncStreamResponse<T>.asFlow(): Flow<T> = callbackFlow {
    val handler = object : AsyncStreamResponse.Handler<T> {
        override fun onNext(value: T) {
            trySend(value)
        }

        override fun onComplete(error: Optional<Throwable>) {
            if (error.isPresent) {
                close(error.get())
            } else {
                close()
            }
        }
    }

    // Subscribe to the stream with our handler
    val response = this@asFlow.subscribe(handler)

    // Close the response when the flow collection is cancelled
    awaitClose {
        response.close()
    }
}

val RawMessageStreamEvent.contentBlockDelta: RawContentBlockDeltaEvent?
    get() = contentBlockDelta().getOrNull()

val RawContentBlockDeltaEvent.delta: RawContentBlockDelta
    get() = delta()

val RawContentBlockDelta.text: TextDelta?
    get() = text().getOrNull()

val Message.stopReason: StopReason?
    get() = stopReason().getOrNull()

fun ContentBlock.asContentBlockType(): ContentBlockType = accept(object : ContentBlock.Visitor<ContentBlockType> {
    override fun visitText(text: TextBlock): ContentBlockType = ContentBlockType.Text(text.text())
    override fun visitToolUse(toolUse: ToolUseBlock): ContentBlockType = ContentBlockType.ToolUse(toolUse.id(), toolUse.name(), toolUse._input())
    override fun visitThinking(thinking: ThinkingBlock): ContentBlockType = ContentBlockType.Thinking(thinking)
    override fun visitRedactedThinking(redactedThinking: RedactedThinkingBlock) = ContentBlockType.RedactedThinking(redactedThinking)
})

sealed class ContentBlockType {
    data class Text(val text: String) : ContentBlockType()
    data class ToolUse(val id: String, val name: String, val input: JsonValue) : ContentBlockType()
    data class Thinking(val thinking: ThinkingBlock) : ContentBlockType()
    data class RedactedThinking(val redactedThinking: RedactedThinkingBlock) : ContentBlockType()
}

fun RawContentBlockDelta.asRawContentBlockDeltaType(): RawContentBlockDeltaType = accept(object :RawContentBlockDelta.Visitor<RawContentBlockDeltaType> {
    override fun visitText(text: TextDelta) = RawContentBlockDeltaType.Text(text.text())
    override fun visitThinking(thinking: ThinkingDelta) = RawContentBlockDeltaType.Thinking(thinking.thinking())
    override fun visitCitations(citations: CitationsDelta) = RawContentBlockDeltaType.Citation(citations.citation())
    override fun visitSignature(signature: SignatureDelta) = RawContentBlockDeltaType.Signature(signature.signature())
    override fun visitInputJson(inputJson: InputJsonDelta) = RawContentBlockDeltaType.InputJson(inputJson.partialJson())
})

sealed class RawContentBlockDeltaType {
    data class Text(val text: String) : RawContentBlockDeltaType()
    data class Thinking(val text: String) : RawContentBlockDeltaType()
    data class Citation(val citation: CitationsDelta.Citation) : RawContentBlockDeltaType()
    data class Signature(val signature: String) : RawContentBlockDeltaType()
    data class InputJson(val partialJson: String) : RawContentBlockDeltaType()
}
