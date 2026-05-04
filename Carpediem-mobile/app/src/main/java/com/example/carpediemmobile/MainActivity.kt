package com.example.carpediemmobile

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.SmartToy
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.navigation.compose.*
import com.example.carpediemmobile.screens.*
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.padding

@Composable
fun MainScreen() {
    val navController = rememberNavController()
    val currentBackStack by navController.currentBackStackEntryAsState()
    val currentRoute = currentBackStack?.destination?.route

    val showBottomBar = currentRoute != "captain"

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    NavigationBarItem(
                        selected = currentRoute == "dashboard",
                        onClick = { navController.navigate("dashboard") },
                        icon = { Icon(Icons.Default.Home, null) },
                        label = { Text("Inicio") }
                    )

                    NavigationBarItem(
                        selected = currentRoute == "notes",
                        onClick = { navController.navigate("notes") },
                        icon = { Icon(Icons.Default.MenuBook, null) },
                        label = { Text("Apuntes") }
                    )

                    NavigationBarItem(
                        selected = currentRoute == "captain",
                        onClick = { navController.navigate("captain") },
                        icon = { Icon(Icons.Default.SmartToy, null) },
                        label = { Text("Capitán") }
                    )

                    NavigationBarItem(
                        selected = currentRoute == "calendar",
                        onClick = { navController.navigate("calendar") },
                        icon = { Icon(Icons.Default.CalendarMonth, null) },
                        label = { Text("Calendario") }
                    )

                    NavigationBarItem(
                        selected = currentRoute == "profile",
                        onClick = { navController.navigate("profile") },
                        icon = { Icon(Icons.Default.Person, null) },
                        label = { Text("Perfil") }
                    )
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = "dashboard",
            modifier = androidx.compose.ui.Modifier.padding(padding)
        ) {
            composable("dashboard") { DashboardScreen(navController) }
            composable("notes") { NotesScreen(navController) }
            composable("captain") { CaptainScreen(navController) }
            composable("calendar") { CalendarScreen(navController) }
            composable("profile") { ProfileScreen(navController) }
        }
    }
}