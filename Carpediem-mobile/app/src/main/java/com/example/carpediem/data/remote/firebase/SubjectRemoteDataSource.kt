package com.example.carpediem.data.remote.firebase

import com.example.carpediem.data.local.entity.SubjectEntity
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import com.google.firebase.Timestamp
import java.time.Instant

class SubjectRemoteDataSource(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {

    suspend fun createSubject(subject: SubjectEntity) {
        firestore
            .collection("subjects")
            .document(subject.id)
            .set(
                mapOf(
                    "id" to subject.id,
                    "uid" to subject.uid,
                    "name" to subject.name,
                    "createdAt" to subject.createdAt
                )
            )
            .await()
    }

    suspend fun getSubjects(uid: String): List<SubjectEntity> {
        val snapshot = firestore
            .collection("subjects")
            .whereEqualTo("uid", uid)
            .get()
            .await()

        return snapshot.documents.mapNotNull { doc ->
            val name = doc.getString("name") ?: return@mapNotNull null

            SubjectEntity(
                id = doc.getString("id") ?: doc.id,
                uid = doc.getString("uid") ?: uid,
                name = name,
                createdAt = readCreatedAtMillis(doc.get("createdAt"))
            )
        }.sortedByDescending { it.createdAt }
    }
    private fun readCreatedAtMillis(value: Any?): Long {
        return when (value) {
            is com.google.firebase.Timestamp -> value.toDate().time
            is java.util.Date -> value.time
            is Long -> value
            is Double -> value.toLong()
            is String -> {
                try {
                    java.time.Instant.parse(value).toEpochMilli()
                } catch (e: Exception) {
                    0L
                }
            }
            else -> 0L
        }
    }
    suspend fun deleteSubject(subjectId: String) {
        firestore
            .collection("subjects")
            .document(subjectId)
            .delete()
            .await()
    }
}