package dev.komu.envoy.backend

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
sealed class OutgoingMessage {

    @Serializable
    @SerialName("text")
    data class Text(val text: String, val delta: Boolean = false) : OutgoingMessage()

    @Serializable
    @SerialName("thinking")
    data class Thinking(val text: String, val delta: Boolean = false) : OutgoingMessage()

    @Serializable
    @SerialName("tool-call")
    data class ToolCall(val tool: String, val input: String, val output: String?) : OutgoingMessage()

    @Serializable
    @SerialName("tool-permission-request")
    data class ToolPermissionRequest(val requestId: String, val tool: String, val input: String) : OutgoingMessage()
}
