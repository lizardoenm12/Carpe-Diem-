package com.example.carpediem.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.compose.*
import androidx.compose.ui.unit.dp
import com.example.carpediem.presentation.calendar.CalendarScreen
import com.example.carpediem.presentation.chat.ChatCapitanScreen
import com.example.carpediem.presentation.dashboard.DashboardScreen
import com.example.carpediem.presentation.notes.NotesScreen
import com.example.carpediem.presentation.notes.SubjectDetailScreen
import androidx.navigation.NavType
import androidx.navigation.navArgument
import androidx.compose.material.icons.filled.SportsEsports
import com.example.carpediem.presentation.profile.ProfileScreen
import androidx.compose.material.icons.filled.Psychology
import com.example.carpediem.presentation.games.GamesScreen
import com.example.carpediem.presentation.games.FlashcardsScreen

@Composable
fun MainScaffold(
    onCheckInClick: () -> Unit,
    onScheduleClick: () -> Unit,
    onGamesClick: () -> Unit,
    onLogout: () -> Unit
) {
    val bottomNavController = rememberNavController()

    val items = listOf(
        BottomNavItem(
            route = Routes.Dashboard.route,
            label = "Inicio",
            icon = Icons.Default.Home
        ),
        BottomNavItem(
            route = Routes.Notes.route,
            label = "Apuntes",
            icon = Icons.Default.School
        ),
        BottomNavItem(
            route = Routes.Calendar.route,
            label = "Agenda",
            icon = Icons.Default.CalendarMonth
        ),
        BottomNavItem(
            route = Routes.Chat.route,
            label = "Capitan",
            icon = Icons.Default.Psychology
        ),
        BottomNavItem(
            route = Routes.Games.route,
            label = "Juegos",
            icon = Icons.Default.SportsEsports
        )
    )

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 8.dp
            ) {
                val navBackStackEntry by bottomNavController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination

                items.forEach { item ->
                    val selected = currentDestination?.hierarchy?.any {
                        it.route == item.route
                    } == true

                    NavigationBarItem(
                        selected = selected,
                        onClick = {
                            bottomNavController.navigate(item.route) {
                                popUpTo(bottomNavController.graph.startDestinationId) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = item.label
                            )
                        },
                        label = {
                            Text(item.label)
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color(0xFF27500A),
                            selectedTextColor = Color(0xFF27500A),
                            indicatorColor = Color(0xFFE1F5EE),
                            unselectedIconColor = Color.Gray,
                            unselectedTextColor = Color.Gray
                        )
                    )
                }
            }
        }
    ) { innerPadding ->

        NavHost(
            navController = bottomNavController,
            startDestination = Routes.Dashboard.route,
            modifier = Modifier.padding(innerPadding)

        ) {
            composable(Routes.Dashboard.route) {
                DashboardScreen(
                    onNotesClick = {
                        bottomNavController.navigate(Routes.Notes.route)
                    },
                    onCalendarClick = {
                        bottomNavController.navigate(Routes.Calendar.route)
                    },
                    onChatClick = {
                        bottomNavController.navigate(Routes.Chat.route)
                    },
                    onCheckInClick = onCheckInClick,
                    onScheduleClick = onScheduleClick,
                    onGamesClick = onGamesClick,
                    onProfileClick = {
                        bottomNavController.navigate(Routes.Profile.route)
                    }
                )
            }

            composable(Routes.Notes.route) {
                NotesScreen(
                    onSubjectClick = { subjectId ->
                        bottomNavController.navigate(
                            Routes.SubjectDetail.createRoute(android.net.Uri.encode(subjectId))
                        )
                    }
                )
            }
            composable(Routes.Profile.route) {
                ProfileScreen(
                    onBackClick = {
                        bottomNavController.popBackStack()
                    },
                    onLogout = onLogout
                )
            }
            composable(
                route = Routes.SubjectDetail.route,
                arguments = listOf(
                    navArgument(Routes.SubjectDetail.ARG) {
                        type = NavType.StringType
                    }
                )
            ) { backStackEntry ->

                val subjectId = backStackEntry.arguments
                    ?.getString(Routes.SubjectDetail.ARG)
                    ?: ""

                SubjectDetailScreen(
                    subjectId = subjectId,
                    onBackClick = {
                        bottomNavController.popBackStack()
                    }
                )
            }

            composable(Routes.Calendar.route) {
                CalendarScreen()
            }

            composable(Routes.Chat.route) {
                ChatCapitanScreen()
            }

            composable(Routes.Games.route) {
                GamesScreen(
                    onFlashcardsClick = {
                        bottomNavController.navigate(Routes.Flashcards.route)
                    }
                )
            }
            composable(Routes.Flashcards.route) {
                FlashcardsScreen(
                    onBackClick = {
                        bottomNavController.popBackStack()
                    }
                )
            }
        }
    }
}

@Composable
private fun PlaceholderScreen(title: String) {
    Surface(
        color = Color(0xFFF5F5DC)
    ) {
        Text(
            text = title,
            color = Color(0xFF27500A),
            style = MaterialTheme.typography.headlineSmall,
            modifier = Modifier.padding(24.dp)
        )
    }
}