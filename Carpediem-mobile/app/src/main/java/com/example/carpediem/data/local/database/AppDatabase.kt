package com.example.carpediem.data.local.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.example.carpediem.data.local.dao.SubjectDao
import com.example.carpediem.data.local.entity.SubjectEntity

@Database(
    entities = [SubjectEntity::class],
    version = 1
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun subjectDao(): SubjectDao
}
