package com.buroq.billing.ui.customers

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.buroq.billing.data.api.CustomerData
import com.buroq.billing.ui.payments.PaymentDialog

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerListScreen(
    viewModel: CustomerViewModel = viewModel()
) {
    val context = LocalContext.current
    var selectedCustomer by remember { mutableStateOf<CustomerData?>(null) }

    LaunchedEffect(Unit) {
        viewModel.loadCustomers()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8F9FA))
    ) {
        TopAppBar(
            title = { Text("Daftar Pelanggan", fontWeight = FontWeight.Bold) },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
        )

        // Search Bar
        OutlinedTextField(
            value = viewModel.searchQuery,
            onValueChange = { viewModel.onSearchQueryChange(it) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            placeholder = { Text("Cari nama atau ID...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = Color.White,
                unfocusedContainerColor = Color.White
            )
        )

        when (val state = viewModel.uiState) {
            is CustomerUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is CustomerUiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(text = state.message, color = Color.Red)
                }
            }
            is CustomerUiState.Success -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.customers) { customer ->
                        CustomerItem(
                            customer = customer,
                            onPayClick = { selectedCustomer = customer }
                        )
                    }
                }
            }
        }
    }

    // Payment Dialog
    selectedCustomer?.let { customer ->
        PaymentDialog(
            customer = customer,
            onDismiss = { selectedCustomer = null },
            onConfirm = { amount ->
                viewModel.processPayment(customer.username, amount) { success, error ->
                    if (success) {
                        Toast.makeText(context, "Pembayaran Berhasil!", Toast.LENGTH_SHORT).show()
                        selectedCustomer = null
                    } else {
                        Toast.makeText(context, error ?: "Terjadi kesalahan", Toast.LENGTH_LONG).show()
                    }
                }
            }
        )
    }
}

@Composable
fun CustomerItem(
    customer: CustomerData,
    onPayClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterHorizontally,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = customer.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = Color(0xFF212529)
                )
                Text(
                    text = "ID: ${customer.customerId}",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
                Text(
                    text = customer.username,
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }

            Button(
                onClick = onPayClick,
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6650a4)),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp)
            ) {
                Icon(Icons.Default.Payments, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("BAYAR", fontSize = 12.sp)
            }
        }
    }
}
