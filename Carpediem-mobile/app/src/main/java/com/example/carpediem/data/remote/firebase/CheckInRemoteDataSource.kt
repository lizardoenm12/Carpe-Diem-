package com.example.carpediem.data.remote.firebase

import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

class CheckInRemoteDataSource(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    suspend fun getLatestCheckIn(uid: String): CheckInDto? {
        val snapshot = firestore
            .collection("checkins")
            .whereEqualTo("uid", uid)
            .orderBy("createdAt", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(1)
            .get()
            .await()

        val doc = snapshot.documents.firstOrNull() ?: return null

        return CheckInDto(
            uid = doc.getString("uid") ?: uid,
            fecha = doc.getString("fecha") ?: "",
            nivelEmocion = doc.getLong("nivelEmocion")?.toInt() ?: 5,
            color = doc.getString("color") ?: "#E1F5EE",
            estado = doc.getString("estado") ?: "estable",
            createdAt = doc.getLong("createdAt") ?: 0L
        )
    }
}