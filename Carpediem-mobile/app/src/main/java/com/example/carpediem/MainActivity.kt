package com.example.carpediem

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.example.carpediem.navigation.AppNavGraph
import com.example.carpediem.ui.theme.CarpediemTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CarpediemTheme() {
                AppNavGraph()
            }
        }

    }
}