// Import Firestore functions
import { firestore } from '../../../resources/script/config.js';
import { collection, getDocs, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

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
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = ''; // Clear the table
    let unpaidPendingTotal = 0; // Ensure it's a number
    let paidTotal = 0; // Ensure it's a number

    try {
        const querySnapshot = await getDocs(collection(firestore, 'apprehensions'));
        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();

            // Filter based on the selected status
            if (selectedStatusFilter && data.status !== selectedStatusFilter) {
                return; // Skip this item if it doesn't match the selected filter
            }

            const row = document.createElement('tr');
            const violations = data.selectedViolations && Array.isArray(data.selectedViolations)
                ? data.selectedViolations.map(violation => violation.name).join(', ')
                : 'N/A';

            // Generate status badge based on status
            let statusBadge = '';
            const status = data.status || 'pending'; // Default to 'pending' if no status
            const totalAmount = parseFloat(data.totalAmount) || 0; // Ensure it's a number

            if (status === 'paid') {
                statusBadge = `<span class="badge bg-success w-100 px-1">${status}</span>`;
                paidTotal += totalAmount; // Add to paid total
            } else if (status === 'unpaid') {
                statusBadge = `<span class="badge bg-danger w-100 px-1">${status}</span>`;
                unpaidPendingTotal += totalAmount; // Add to unpaid/pending total
            } else if (status === 'pending') {
                statusBadge = `<span class="badge bg-warning w-100 px-1">${status}</span>`;
                unpaidPendingTotal += totalAmount; // Add to unpaid/pending total
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
                    <button class="btn btn-primary change-status" data-id="${docSnapshot.id}" data-status="${status}" data-total="${totalAmount}">
                        Edit
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Update the total amounts
        document.getElementById('totalUnpaidAmount').innerText = `Unpaid/Pending Total: ${formatAmount(unpaidPendingTotal.toFixed(2))}`;
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

// Update Status in Firestore (only for non-'paid' statuses)
async function updateStatus(newStatus) {
    try {
        const docRef = doc(firestore, 'apprehensions', selectedDocId);
        await updateDoc(docRef, { status: newStatus });

        console.log("Status updated successfully");
        fetchApprehensionsData(); // Re-fetch and update the table
        document.querySelector('[data-bs-dismiss="modal"]').click();
    } catch (error) {
        console.error("Error updating status:", error);
    }
}

// Event delegation for the change-status button
document.addEventListener('click', (event) => {
    if (event.target && event.target.classList.contains('change-status')) {
        const docId = event.target.getAttribute('data-id');
        const currentStatus = event.target.getAttribute('data-status');
        const totalAmount = parseFloat(event.target.getAttribute('data-total'));
        openStatusModal(docId, currentStatus, totalAmount);
    }
});

// Handle Payment Modal's Done button click
document.getElementById('paymentDoneBtn').addEventListener('click', async () => {
    const orNumber = document.getElementById('orNumber').value;
    const amount = parseFloat(document.getElementById('amount').value);

    if (orNumber && amount) {
        if (amount === selectedTotalAmount) {
            // If the amount matches the totalAmount, update status and payment details
            try {
                const docRef = doc(firestore, 'apprehensions', selectedDocId);
                await updateDoc(docRef, {
                    status: 'paid',
                    orNumber: orNumber
                });

                console.log("Payment details and status updated successfully");
                fetchApprehensionsData(); // Re-fetch and update the table

                document.querySelector('[data-bs-dismiss="modal"]').click();
                
            } catch (error) {
                console.error("Error updating payment details:", error);
            }
        } else {
            // Show error if the amount doesn't match
            alert("The entered amount does not match the total amount.");
        }
    } else {
        alert("Please fill out both OR Number and Amount fields.");
    }
});

// Handle status filter change
document.getElementById('statusFilter').addEventListener('change', (event) => {
    selectedStatusFilter = event.target.value;
    fetchApprehensionsData(); // Re-fetch data with the new filter
});

// Initialize and fetch the data
fetchApprehensionsData();
