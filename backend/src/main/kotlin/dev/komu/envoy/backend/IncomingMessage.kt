package dev.komu.envoy.backend

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
sealed class IncomingMessage {
    @Serializable
    @SerialName("message")
    data class TextMessage(val message: String) : IncomingMessage()

    @Serializable
    @SerialName("tool-permission-response")
    data class ToolPermissionResponse(val requestId: String, val selection: ToolPermissionResponseSelection) : IncomingMessage()
}

enum class ToolPermissionResponseSelection {
    AllowOnce, AllowAlways, Deny,
}
