package com.example.carpediem.data.remote.firebase

import android.net.Uri
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.tasks.await
import java.util.UUID

class SubjectFileRemoteDataSource {

    private val storage = FirebaseStorage.getInstance()
    private val firestore = FirebaseFirestore.getInstance()
    private val auth = FirebaseAuth.getInstance()

    suspend fun uploadFile(
        subjectId: String,
        uri: Uri,
        fileName: String
    ) {

        val user = auth.currentUser ?: return

        val fileId = UUID.randomUUID().toString()

        val ref = storage.reference
            .child("subjects")
            .child(subjectId)
            .child(fileId)

        ref.putFile(uri).await()

        val downloadUrl = ref.downloadUrl.await().toString()

        val fileData = mapOf(
            "id" to fileId,
            "subjectId" to subjectId,
            "uid" to user.uid,
            "fileName" to fileName,
            "downloadUrl" to downloadUrl,
            "createdAt" to System.currentTimeMillis()
        )

        firestore
            .collection("subjectFiles")
            .document(fileId)
            .set(fileData)
            .await()
    }

    suspend fun getFiles(
        subjectId: String
    ): List<SubjectFileDto> {

        val snapshot = firestore
            .collection("subjectFiles")
            .whereEqualTo("subjectId", subjectId)
            .get()
            .await()

        return snapshot.documents.mapNotNull { doc ->

            val fileName = doc.getString("fileName")
                ?: return@mapNotNull null

            SubjectFileDto(
                id = doc.getString("id") ?: doc.id,
                subjectId = doc.getString("subjectId") ?: "",
                uid = doc.getString("uid") ?: "",
                fileName = fileName,
                downloadUrl = doc.getString("downloadUrl") ?: "",
                createdAt = doc.getLong("createdAt") ?: 0L
            )
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