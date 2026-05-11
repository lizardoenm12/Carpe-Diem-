package com.example.carpediem.data.repository

import com.example.carpediem.data.local.dao.SubjectDao
import com.example.carpediem.data.local.entity.SubjectEntity
import kotlinx.coroutines.flow.Flow
import com.example.carpediem.data.remote.firebase.SubjectRemoteDataSource

class SubjectRepository(
    private val dao: SubjectDao,
    private val remote: SubjectRemoteDataSource
) {

    fun getSubjectsByUser(uid: String): Flow<List<SubjectEntity>> {
        return dao.getSubjectsByUser(uid)
    }

    suspend fun createSubject(uid: String, name: String) {
        if (name.isBlank()) return

        val subject = SubjectEntity(
            id = java.util.UUID.randomUUID().toString(),
            uid = uid,
            name = name,
            createdAt = System.currentTimeMillis()
        )

        // local
        dao.insertSubjects(listOf(subject))

        // firebase
        remote.createSubject(subject)
    }
    suspend fun syncSubjects(uid: String) {

        val local = dao.getSubjectsOnce(uid)
        val remoteData = remote.getSubjects(uid)

        val localMap = local.associateBy { it.id }
        val remoteMap = remoteData.associateBy { it.id }

        val merged = mutableListOf<SubjectEntity>()

        // 1. Mantener locales
        for (subject in local) {
            merged.add(subject)
        }

        // 2. Agregar remotos que no existen local
        for (subject in remoteData) {
            if (!localMap.containsKey(subject.id)) {
                merged.add(subject)
            }
        }

        dao.insertSubjects(merged)
    }
    suspend fun deleteSubject(subjectId: String) {
        dao.deleteSubjectById(subjectId)
        remote.deleteSubject(subjectId)
    }
}