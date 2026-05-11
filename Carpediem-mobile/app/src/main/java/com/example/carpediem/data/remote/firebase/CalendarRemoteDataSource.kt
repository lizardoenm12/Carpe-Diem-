package com.example.carpediem.data.remote.firebase


import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import java.time.Instant
import java.util.Date
import com.google.firebase.auth.FirebaseAuth


data class CalendarEventDto(
    val id: String = "",
    val uid: String = "",
    val titulo: String = "",
    val descripcion: String = "",
    val tipo: String = "estudio",
    val completado: Boolean = false,
    val fechaMillis: Long = 0L
)

class CalendarRemoteDataSource(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {

    suspend fun getEvents(uid: String): List<CalendarEventDto> {
        val snapshot = firestore
            .collection("eventos")
            .whereEqualTo("uid", uid)
            .get()
            .await()

        return snapshot.documents.map { doc ->
            CalendarEventDto(
                id = doc.id,
                uid = doc.getString("uid") ?: "",
                titulo = doc.getString("titulo")
                    ?: doc.getString("title")
                    ?: "Sin título",
                descripcion = doc.getString("descripcion") ?: "",
                tipo = doc.getString("tipo") ?: "tarea",
                completado = doc.getBoolean("completado")
                    ?: doc.getBoolean("completed")
                    ?: false,
                fechaMillis = readFechaMillis(
                    doc.get("fecha") ?: doc.get("date")
                )
            )
        }.sortedBy { it.fechaMillis }
    }
    private fun readFechaMillis(value: Any?): Long {
        return when (value) {
            is Timestamp -> value.toDate().time
            is Date -> value.time
            is Long -> value
            is Double -> value.toLong()
            is String -> {
                try {
                    val formatter = java.text.SimpleDateFormat(
                        "yyyy-MM-dd",
                        java.util.Locale.getDefault()
                    )
                    formatter.parse(value)?.time ?: 0L
                } catch (e: Exception) {
                    0L
                }
            }
            else -> 0L
        }
    }

    suspend fun updateCompleted(eventId: String, completed: Boolean) {
        firestore
            .collection("eventos")
            .document(eventId)
            .update("completado", completed)
            .await()
    }
    suspend fun addEvent(
        titulo: String,
        descripcion: String,
        tipo: String,
        fechaMillis: Long
    ) {
        val user = FirebaseAuth.getInstance().currentUser ?: return

        val doc = firestore.collection("eventos").document()

        val fechaString = java.text.SimpleDateFormat(
            "yyyy-MM-dd",
            java.util.Locale.getDefault()
        ).format(java.util.Date(fechaMillis))

        val data = mapOf(
            "fecha" to fechaString,
            "uid" to user.uid,
            "titulo" to titulo,
            "tipo" to tipo,
            "completado" to false
        )

        doc.set(data).await()
    }
    suspend fun deleteEvent(eventId: String) {
        firestore
            .collection("eventos")
            .document(eventId)
            .delete()
            .await()
    }
}
