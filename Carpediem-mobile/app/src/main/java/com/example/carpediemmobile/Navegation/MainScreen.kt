package com.example.carpediemmobile.navigation

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.navigation.compose.*
import com.example.carpediemmobile.screens.*

@Composable
fun MainScreen() {

    val navController = rememberNavController()

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = false,
                    onClick = { navController.navigate("dashboard") },
                    label = { Text("Inicio") },
                    icon = { Icon(Icons.Default.Home, contentDescription = null) }
                )

                NavigationBarItem(
                    selected = false,
                    onClick = { navController.navigate("notes") },
                    label = { Text("Apuntes") },
                    icon = { Icon(Icons.Default.Menu, contentDescription = null) }
                )

                NavigationBarItem(
                    selected = false,
                    onClick = { navController.navigate("captain") },
                    label = { Text("Capitán") },
                    icon = { Icon(Icons.Default.Face, contentDescription = null) }
                )

                NavigationBarItem(
                    selected = false,
                    onClick = { navController.navigate("calendar") },
                    label = { Text("Calendario") },
                    icon = { Icon(Icons.Default.DateRange, contentDescription = null) }
                )

                NavigationBarItem(
                    selected = false,
                    onClick = { navController.navigate("profile") },
                    label = { Text("Perfil") },
                    icon = { Icon(Icons.Default.Person, contentDescription = null) }
                )
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