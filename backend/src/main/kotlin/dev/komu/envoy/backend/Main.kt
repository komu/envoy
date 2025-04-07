package dev.komu.envoy.backend
import io.ktor.server.application.*
import io.ktor.server.engine.embeddedServer
import io.ktor.server.http.content.*
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.calllogging.CallLogging
import io.ktor.server.plugins.defaultheaders.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.channels.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlin.time.Duration.Companion.minutes

fun main() {

    embeddedServer(Netty, port = 8080) {
        ChatApplication().apply { main() }
    }.start(wait = true)
}

class ChatApplication {

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
                    if (frame is Frame.Text) {
                        val msg = Json.Default.decodeFromString(IncomingMessage.serializer(), frame.readText()).message

                        session.message(msg, this)
                    }
                }
            }
            staticResources("", "web")
        }
    }

    @Serializable
    data class IncomingMessage(val message: String)
}
