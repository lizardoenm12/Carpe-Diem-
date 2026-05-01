package com.example.carpediemmobile.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.*
import com.example.carpediemmobile.screens.*

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "dashboard") {

        composable("dashboard") {
            DashboardScreen(navController)
        }

        composable("notes") {
            NotesScreen(navController)
        }

        composable("captain") {
            CaptainScreen(navController)
        }

        composable("calendar") {
            CalendarScreen(navController)
        }

        composable("profile") {
            ProfileScreen(navController)
        }
        composable("calm") {
            CalmSpaceScreen(navController)
        }
    }
}