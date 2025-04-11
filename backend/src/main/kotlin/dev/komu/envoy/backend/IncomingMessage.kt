package dev.komu.envoy.backend

import kotlinx.serialization.Serializable

@Serializable
data class IncomingMessage(val message: String)
