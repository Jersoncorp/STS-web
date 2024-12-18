// Import Firestore functions
import { firestore } from '../../../resources/script/config.js';
import { collection, getDocs, doc, updateDoc, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

let selectedDocId = null;
let selectedTotalAmount = 0; // Store the total amount for validation
let selectedStatusFilter = '';

// Helper function to format numbers with commas
function formatAmount(amount) {
    if (isNaN(amount)) return 'N/A'; // Handle invalid numbers
    return new Intl.NumberFormat().format(amount);
}

// Fetch data from Firestore and populate the table
async function fetchApprehensionsData() {
    const paidTableBody = document.getElementById('paidDataTableBody');
    const unpaidTableBody = document.getElementById('unpaidDataTableBody');
    paidTableBody.innerHTML = ''; // Clear the paid table
    unpaidTableBody.innerHTML = ''; // Clear the unpaid table
    let overdueUnpaidTotal = 0; // Ensure it's a number
    let paidTotal = 0; // Ensure it's a number

    try {
        const querySnapshot = await getDocs(collection(firestore, 'apprehensions'));
        const data = [];

        querySnapshot.forEach((docSnapshot) => {
            const docData = docSnapshot.data();
            data.push({ id: docSnapshot.id, ...docData });
        });
        
        // Sort the data by timestamp (most recent first)
        data.sort((a, b) => b.timestamp - a.timestamp);

        // Separate data into paid and unpaid arrays
        const paidData = [];
        const unpaidData = [];

        data.forEach((data) => {
            // Filter based on the selected status
            if (selectedStatusFilter && data.status !== selectedStatusFilter) {
                return; // Skip this item if it doesn't match the selected filter
            }

            const row = document.createElement('tr');
            const violations = data.selectedViolations && Array.isArray(data.selectedViolations)
                ? data.selectedViolations.map(violation => violation.name).join(', ')
                : 'N/A';

            // Default to 'overdue' if no status is available
            const status = data.status || 'overdue'; // Ensure status is never undefined
            let statusBadge = '';
            const totalAmount = parseFloat(data.totalAmount) || 0; // Ensure it's a number

            // Generate status badge based on status
            switch (status) {
                case 'paid':
                    statusBadge = `<span class="badge bg-success w-100 px-1">${status}</span>`;
                    paidTotal += totalAmount; // Add to paid total
                    paidData.push({ row, data }); // Add to paid data array
                    break;
                case 'unpaid':
                    statusBadge = `<span class="badge bg-warning w-100 px-1">${status}</span>`;
                    overdueUnpaidTotal += totalAmount; // Add to unpaid/overdue total
                    unpaidData.push({ row, data }); // Add to unpaid data array
                    break;
                case 'overdue':
                default:
                    statusBadge = `<span class="badge bg-danger w-100 px-1">${status}</span>`;
                    overdueUnpaidTotal += totalAmount; // Add to unpaid/overdue total
                    unpaidData.push({ row, data }); // Add to unpaid data array
                    break;
            }

            // Fill the table row with data
            row.innerHTML = `
                <td>${data.fullName || 'N/A'}</td>
                <td>${data.orNumber || 'N/A'}</td>
                <td>${statusBadge}</td>
                <td>${data.address || 'N/A'}</td>
                <td>${data.plateNumber || 'N/A'}</td>
                <td>${data.vehicleType || 'N/A'}</td>
                <td>${violations}</td>
                <td>${new Date(data.timestamp * 1000).toLocaleDateString() || 'N/A'}</td>
                <td>${data.officerApprehend || 'N/A'}</td>
                <td>${formatAmount(totalAmount) || 'N/A'}</td> <!-- Format the amount -->
                <td>
                    <button class="btn btn-primary change-status" data-id="${data.id}" data-status="${status}" data-total="${totalAmount}">
                        Edit
                    </button>
                </td>
            `;

            // Append rows to respective tables
            if (status === 'paid') {
                paidTableBody.appendChild(row);
            } else {
                unpaidTableBody.appendChild(row);
            }
        });

        // Update the total amounts
        document.getElementById('totalUnpaidAmount').innerText = `Overdue/Unpaid Total: ${formatAmount(overdueUnpaidTotal.toFixed(2))}`;
        document.getElementById('totalPaidAmount').innerText = `Total Paid Amount: ${formatAmount(paidTotal.toFixed(2))}`;

    } catch (error) {
        console.error("Error fetching apprehensions data:", error);
    }
}

// Export to Excel
const exportXLS = async () => {
    try {
        const querySnapshot = await getDocs(collection(firestore, 'apprehensions'));
        const data = [];
        querySnapshot.forEach((docSnapshot) => {
            const apprehensionData = docSnapshot.data();
            const violations = apprehensionData.selectedViolations && Array.isArray(apprehensionData.selectedViolations)
                ? apprehensionData.selectedViolations.map(violation => violation.name).join(', ')
                : 'N/A';

            data.push({
                "Full Name": apprehensionData.fullName || 'N/A',
                "OR Number": apprehensionData.orNumber || 'N/A',
                "Status": apprehensionData.status || 'N/A',
                "Address": apprehensionData.address || 'N/A',
                "Plate Number": apprehensionData.plateNumber || 'N/A',
                "Vehicle Type": apprehensionData.vehicleType || 'N/A',
                "Violations": violations,
                "Date": new Date(apprehensionData.timestamp * 1000).toLocaleDateString() || 'N/A',
                "Officer Apprehended": apprehensionData.officerApprehend || 'N/A',
                "Total Amount": formatAmount(apprehensionData.totalAmount) || 'N/A', // Format the amount
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Apprehensions");

        // Export the data as Excel file
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        XLSX.writeFile(workbook, `apprehensions_data_${formattedDate}.xlsx`);

    } catch (error) {
        console.error("Error exporting apprehensions: ", error);
    }
};

// Function to log actions to history
async function logHistory(actionType, details) {
    try {
        const historyRef = collection(firestore, 'historyLogs');
        const timestamp = new Date();
        const historyData = {
            actionType: actionType,
            details: details,
            timestamp: timestamp.toISOString(), // Store in ISO format for easier sorting
        };
        await addDoc(historyRef, historyData);
        console.log("History logged successfully");
    } catch (error) {
        console.error("Error logging history:", error);
    }
}

// Open Status Modal
function openStatusModal(docId, currentStatus, totalAmount) {
    selectedDocId = docId;
    selectedTotalAmount = totalAmount; // Save the total amount for later validation
    const statusSelect = document.getElementById('statusSelect');
    statusSelect.value = currentStatus;
    const modal = new bootstrap.Modal(document.getElementById('statusModal'));
    modal.show();
}

// Close Status Modal
document.getElementById('closeStatusModal').addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('statusModal'));
    modal.hide();
});

// Handle Status selection and show Payment Modal
document.getElementById('statusDoneBtn').addEventListener('click', () => {
    const selectedStatus = document.getElementById('statusSelect').value;

    if (selectedStatus === 'paid') {
        // If 'Paid' is selected, show the Payment Modal
        document.querySelector('[data-bs-dismiss="modal"]').click();

        // Show the Payment Modal to ask for OR Number and Amount
        const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
        paymentModal.show();
    } else {
        // For other statuses, update immediately
        updateStatus(selectedStatus);
    }
});

// Event delegation for the change-status button
document.addEventListener('click', (event) => {
    if (event.target && event.target.classList.contains('change-status')) {
        const docId = event.target.getAttribute('data-id');
        const currentStatus = event.target.getAttribute('data-status');
        const totalAmount = parseFloat(event.target.getAttribute('data-total'));
        openStatusModal(docId, currentStatus, totalAmount);
    }
});


// Update Status in Firestore (only for non-'paid' statuses)
async function updateStatus(newStatus) {
    try {
        const docRef = doc(firestore, 'apprehensions', selectedDocId);
        await updateDoc(docRef, { status: newStatus });

        // Log the action to history
        const actionDetails = `Status changed to ${newStatus} for document ID: ${selectedDocId}`;
        await logHistory('Status Change', actionDetails);

        console.log("Status updated and history logged successfully");
        fetchApprehensionsData(); // Re-fetch and update the table
        document.querySelector('[data-bs-dismiss="modal"]').click();
    } catch (error) {
        console.error("Error updating status:", error);
    }
}

// Handle Payment Modal's Done button click
document.getElementById('paymentDoneBtn').addEventListener('click', async () => {
    const orNumber = document.getElementById('orNumber').value;
    const amount = parseFloat(document.getElementById('amount').value) || 0;

    if (orNumber && amount > 0 && amount === selectedTotalAmount) {
        // Proceed with status update if all is valid
        await updateStatus('paid');
        await updateDoc(doc(firestore, 'apprehensions', selectedDocId), {
            orNumber: orNumber,
            totalAmount: amount,
        });

        // Log the payment action
        const actionDetails = `Payment of ${formatAmount(amount)} made for document ID: ${selectedDocId}`;
        await logHistory('Payment', actionDetails);

        fetchApprehensionsData(); // Re-fetch and update the table
    } else {
        alert("Invalid input. Ensure OR Number is provided and the amount matches.");
    }
});

// History Logs Button Click
document.getElementById('historyLogsBtn').addEventListener('click', async () => {
    try {
        // Fetch history logs from Firestore
        const historySnapshot = await getDocs(collection(firestore, 'historyLogs'));
        const historyData = [];

        historySnapshot.forEach((docSnapshot) => {
            const log = docSnapshot.data();
            historyData.push(log);
        });

        // Display history logs in a modal or alert
        if (historyData.length > 0) {
            let historyContent = '<ul>';
            historyData.forEach((log) => {
                historyContent += `<li><strong>${log.actionType}</strong> - ${log.details} <br><small>${new Date(log.timestamp).toLocaleString()}</small></li>`;
            });
            historyContent += '</ul>';
            // Show the history logs in a modal or alert
            alert(`History Logs:\n\n${historyContent}`);
        } else {
            alert('No history logs available.');
        }

    } catch (error) {
        console.error("Error fetching history logs:", error);
        alert('Failed to fetch history logs.');
    }
});

// Initialize the data on page load
fetchApprehensionsData();
