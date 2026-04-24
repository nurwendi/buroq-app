package com.buroq.billing.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import java.text.NumberFormat
import java.util.*

@Composable
fun DashboardScreen(
    role: String,
    viewModel: DashboardViewModel = viewModel()
) {
    LaunchedEffect(role) {
        viewModel.loadStats(role)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8F9FA))
            .padding(16.dp)
    ) {
        Text(
            text = if (role == "customer") "Layanan Saya" else "Dashboard",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        when (val state = viewModel.uiState) {
            is DashboardUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is DashboardUiState.Error -> {
                Text(text = state.message, color = Color.Red)
            }
            is DashboardUiState.AdminSuccess -> {
                val stats = state.stats
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        StatCard(
                            title = "Active PPPoE",
                            value = stats.pppoeActive.toString(),
                            icon = Icons.Default.Speed,
                            gradient = listOf(Color(0xFF6650a4), Color(0xFF8E7AB5))
                        )
                    }
                    item {
                        StatCard(
                            title = "Total Pelanggan",
                            value = stats.totalCustomers.toString(),
                            icon = Icons.Default.People,
                            gradient = listOf(Color(0xFF0D6EFD), Color(0xFF6DAFFE))
                        )
                    }
                    item {
                        StatCard(
                            title = "Pendapatan",
                            value = formatCurrency(stats.monthlyRevenue),
                            icon = Icons.Default.TrendingUp,
                            gradient = listOf(Color(0xFF198754), Color(0xFF4BB17B))
                        )
                    }
                    item {
                        StatCard(
                            title = "CPU Load",
                            value = "${stats.cpuLoad}%",
                            icon = Icons.Default.Speed,
                            gradient = listOf(Color(0xFFFFC107), Color(0xFFFFD54F))
                        )
                    }
                }
            }
            is DashboardUiState.CustomerSuccess -> {
                val stats = state.stats
                CustomerDashboard(stats)
            }
        }
    }
}

@Composable
fun CustomerDashboard(stats: com.buroq.billing.data.api.CustomerStats) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        // Connection Info
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .background(
                            if (stats.session.active) Color(0xFF198754) else Color.Red,
                            shape = androidx.compose.foundation.shape.CircleShape
                        )
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = if (stats.session.active) "Terhubung" else "Terputus",
                        fontWeight = FontWeight.Bold,
                        color = if (stats.session.active) Color(0xFF198754) else Color.Red
                    )
                    Text(text = "Uptime: ${stats.session.uptime}", fontSize = 12.sp, color = Color.Gray)
                }
            }
        }

        // Billing Info
        StatCard(
            title = if (stats.billing.status == "unpaid") "Tagihan Belum Dibayar" else "Tagihan Terbayar",
            value = formatCurrency(stats.billing.amount),
            icon = Icons.Default.TrendingUp,
            gradient = if (stats.billing.status == "unpaid") 
                listOf(Color(0xFFDC3545), Color(0xFFEB7D87)) 
            else 
                listOf(Color(0xFF198754), Color(0xFF4BB17B))
        )

        // Account Details
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "Informasi Akun", fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(text = "Nama", fontSize = 14.sp, color = Color.Gray)
                    Text(text = stats.name, fontWeight = FontWeight.Medium)
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(text = "Invoice", fontSize = 14.sp, color = Color.Gray)
                    Text(text = stats.billing.invoice, fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    icon: ImageVector,
    gradient: List<Color>
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.height(130.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Brush.linearGradient(gradient))
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(24.dp)
                )
                Column {
                    Text(
                        text = value,
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = title,
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

fun formatCurrency(amount: Double): String {
    val format = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
    return format.format(amount)
}
