package com.example.carpediem.data.local

import android.content.Context
import androidx.room.Room
import com.example.carpediem.data.local.database.AppDatabase

object DatabaseProvider {

    private var INSTANCE: AppDatabase? = null

    fun getDatabase(context: Context): AppDatabase {
        return INSTANCE ?: synchronized(this) {
            val instance = Room.databaseBuilder(
                context.applicationContext,
                AppDatabase::class.java,
                "carpe_diem_db"
            ).build()

            INSTANCE = instance
            instance
        }
    }
}