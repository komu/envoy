package dev.komu.envoy.backend
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.http.content.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.calllogging.*
import io.ktor.server.plugins.defaultheaders.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.channels.consumeEach
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlin.time.Duration.Companion.minutes

fun main() {

    embeddedServer(Netty, host = "0.0.0.0", port = 8080) {
        ChatApplication().apply { main() }
    }.start(wait = true)
}

class ChatApplication {

    private val logger = org.slf4j.LoggerFactory.getLogger(ChatApplication::class.java)

    fun Application.main() {
        install(DefaultHeaders)
        install(CallLogging)
        install(WebSockets) {
            pingPeriod = 1.minutes
        }

        routing {
            webSocket("/ws") {

                val session = ClaudeSession()

                incoming.consumeEach { frame ->
                    try {
                        if (frame is Frame.Text) {
                            val msg =
                                Json.Default.decodeFromString(IncomingMessage.serializer(), frame.readText()).message

                            session.message(msg, this)
                        }
                    } catch (e: Exception) {
                        logger.error("Error processing message", e)
                    }
                }
            }
            staticResources("", "web")
        }
    }

    @Serializable
    data class IncomingMessage(val message: String)
}
