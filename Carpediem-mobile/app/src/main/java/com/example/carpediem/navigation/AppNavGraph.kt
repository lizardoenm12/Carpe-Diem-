package com.example.carpediem.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument

import com.example.carpediem.presentation.auth.AuthDestination
import com.example.carpediem.presentation.auth.AuthViewModel
import com.example.carpediem.presentation.auth.LoginScreen
import com.example.carpediem.presentation.onboarding.OnboardingScreen
import com.example.carpediem.presentation.checkin.CheckInScreen
import com.example.carpediem.presentation.dashboard.DashboardScreen
import com.example.carpediem.presentation.notes.NotesScreen
import com.example.carpediem.navigation.MainScaffold

@Composable
fun AppNavGraph() {

    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Routes.Login.route
    ) {

        // ── LOGIN ─────────────────────────────────────────────────────────────
        composable(Routes.Login.route) {
            val viewModel: AuthViewModel = viewModel()
            val destination by viewModel.destination.collectAsState()
            val errorMessage by viewModel.errorMessage.collectAsState()

            LaunchedEffect(destination) {
                when (destination) {
                    AuthDestination.Onboarding -> navController.navigate(Routes.Onboarding.route) {
                        popUpTo(Routes.Login.route) { inclusive = true }
                    }

                    AuthDestination.CheckIn -> navController.navigate(Routes.CheckIn.route) {
                        popUpTo(Routes.Login.route) { inclusive = true }
                    }

                    null -> Unit
                }
            }

            LoginScreen(
                onLoginClick = { email, password ->
                    viewModel.login(email, password)
                },
                onRegisterClick = { email, password ->
                    viewModel.register(email, password)
                },
                onGoogleLoginClick = { idToken ->
                    viewModel.loginWithGoogle(idToken)
                },
                errorMessage = errorMessage
            )
        }

        // ── ONBOARDING ────────────────────────────────────────────────────────
        composable(Routes.Onboarding.route) {
            OnboardingScreen(
                onFinishClick = {
                    navController.navigate(Routes.CheckIn.route) {
                        popUpTo(Routes.Onboarding.route) { inclusive = true }
                    }
                }
            )
        }

        // ── CHECK IN ──────────────────────────────────────────────────────────
        composable(Routes.CheckIn.route) {
            CheckInScreen(
                onFinishClick = {
                    navController.navigate(Routes.Dashboard.route) {
                        popUpTo(Routes.CheckIn.route) { inclusive = true }
                    }
                }
            )
        }

        // ── DASHBOARD ─────────────────────────────────────────────────────────
        // ── MAIN SCAFFOLD ─────────────────────────────────────────────────────
        composable(Routes.Dashboard.route) {
            MainScaffold(
                onCheckInClick = {
                    navController.navigate(Routes.CheckIn.route)
                },
                onScheduleClick = {
                    navController.navigate(Routes.Schedule.route)
                },
                onGamesClick = {
                    navController.navigate(Routes.Games.route)
                },
                onLogout = {
                    navController.navigate(Routes.Login.route) {
                        popUpTo(Routes.Dashboard.route) {
                            inclusive = true
                        }
                        launchSingleTop = true
                    }
                }
            )
        }

        // ── NOTES ─────────────────────────────────────────────────────────────
        composable(Routes.Notes.route) {
            NotesScreen(
                onSubjectClick = { subjectId ->
                    navController.navigate(Routes.SubjectDetail.createRoute(subjectId))
                }
            )
        }

        // ── SUBJECT DETAIL ────────────────────────────────────────────────────
        composable(
            route = Routes.SubjectDetail.route,
            arguments = listOf(
                navArgument(Routes.SubjectDetail.ARG) { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val subjectId = backStackEntry.arguments?.getString(Routes.SubjectDetail.ARG) ?: ""
            // SubjectDetailScreen(subjectId = subjectId)  ← descomenta cuando tengas la pantalla
        }
    }
}