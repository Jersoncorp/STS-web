// Import Firestore functions
import { firestore } from "../../../resources/script/config.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js"; // Import onAuthStateChanged

let selectedDocId = null;
let selectedTotalAmount = 0; // Store the total amount for validation
let selectedStatusFilter = "";

// Helper function to format numbers with commas
function formatAmount(amount) {
  if (isNaN(amount)) return "₱0.00"; // Handle invalid numbers, default to 0
  // Format the number with the international number format and prepend peso sign
  const formattedAmount = new Intl.NumberFormat().format(amount);
  return `₱${formattedAmount}`;
}

// Function to fetch and display apprehensions data, applying filters
// Function to fetch and display apprehensions data, applying filters
async function fetchApprehensionsData() {
    const paidTableBody = document.getElementById('paidDataTableBody');
    const unpaidTableBody = document.getElementById('unpaidDataTableBody');
    const paidViolationsFilter = document.getElementById('paidViolationsFilter').value;
    const paidAddressFilter = document.getElementById('paidAddressFilter').value;
    const paidVehicleTypeFilter = document.getElementById('paidVehicleTypeFilter').value;

    const unpaidViolationsFilter = document.getElementById('unpaidViolationsFilter').value;
    const unpaidAddressFilter = document.getElementById('unpaidAddressFilter').value;
    const unpaidVehicleTypeFilter = document.getElementById('unpaidVehicleTypeFilter').value;

    paidTableBody.innerHTML = ''; // Clear the paid table
    unpaidTableBody.innerHTML = ''; // Clear the unpaid table

    let overdueUnpaidTotal = 0;
    let paidTotal = 0;

    try {
        const querySnapshot = await getDocs(collection(firestore, 'apprehensions'));
        const data = [];

        querySnapshot.forEach((docSnapshot) => {
            const docData = docSnapshot.data();
            data.push({ id: docSnapshot.id, ...docData });
        });

        // Sort the data by timestamp (most recent first)
        data.sort((a, b) => b.timestamp - a.timestamp);

        // Loop through the data and apply the filters
        data.forEach((data) => {
            // Extracting violation names from selectedViolations (array of objects)
            const violations = data.selectedViolations && Array.isArray(data.selectedViolations)
                ? data.selectedViolations.map(violation => violation.name) // Get the 'name' from each violation
                : [];

            const isPaid = data.status === 'paid';
            const isUnpaid = data.status === 'unpaid' || data.status === 'overdue';

            // Check if the row matches the filter criteria for Paid
            const paidFilterMatches = (paidViolationsFilter ? violations.includes(paidViolationsFilter) : true) &&
                                      (paidAddressFilter ? data.address.includes(paidAddressFilter) : true) &&
                                      (paidVehicleTypeFilter ? data.vehicleType.includes(paidVehicleTypeFilter) : true);
            
            // Check if the row matches the filter criteria for Unpaid
            const unpaidFilterMatches = (unpaidViolationsFilter ? violations.includes(unpaidViolationsFilter) : true) &&
                                        (unpaidAddressFilter ? data.address.includes(unpaidAddressFilter) : true) &&
                                        (unpaidVehicleTypeFilter ? data.vehicleType.includes(unpaidVehicleTypeFilter) : true);

            // Paid Table Row
            if (isPaid && paidFilterMatches) {
                const row = document.createElement('tr');
                let statusBadge = `<span class="badge bg-success w-100 px-1">Paid</span>`;
                const totalAmount = parseFloat(data.totalAmount) || 0;

                row.innerHTML = `
                    <td>${data.fullName || 'N/A'}</td>
                    <td>${data.orNumber || 'N/A'}</td>
                    <td>${statusBadge}</td>
                    <td>${data.address || 'N/A'}</td>
                    <td>${data.plateNumber || 'N/A'}</td>
                    <td>${data.vehicleType || 'N/A'}</td>
                    <td>${violations.join(', ') || 'N/A'}</td>
                    <td>${new Date(data.timestamp * 1000).toLocaleDateString() || 'N/A'}</td>
                    <td>${data.officerApprehend || 'N/A'}</td>
                    <td>${formatAmount(totalAmount) || 'N/A'}</td>
                    <td>
                        <button class="btn btn-info view-details" data-id="${data.id}" data-or="${data.orNumber}" data-amount="${totalAmount}">
                            Details
                        </button>
                    </td>
                `;
                paidTableBody.appendChild(row);
                paidTotal += totalAmount;
            }

            // Unpaid Table Row
            if (isUnpaid && unpaidFilterMatches) {
                const row = document.createElement('tr');
                let statusBadge = `<span class="badge bg-warning w-100 px-1">Unpaid</span>`;
                const totalAmount = parseFloat(data.totalAmount) || 0;

                row.innerHTML = `
                    <td>${data.fullName || 'N/A'}</td>
                    <td>${data.orNumber || 'N/A'}</td>
                    <td>${statusBadge}</td>
                    <td>${data.address || 'N/A'}</td>
                    <td>${data.plateNumber || 'N/A'}</td>
                    <td>${data.vehicleType || 'N/A'}</td>
                    <td>${violations.join(', ') || 'N/A'}</td>
                    <td>${new Date(data.timestamp * 1000).toLocaleDateString() || 'N/A'}</td>
                    <td>${data.officerApprehend || 'N/A'}</td>
                    <td>${formatAmount(totalAmount) || 'N/A'}</td>
                    <td>
                        <button class="btn btn-info view-details" data-id="${data.id}" data-or="${data.orNumber}" data-amount="${totalAmount}">
                            Details
                        </button>
                    </td>
                `;
                unpaidTableBody.appendChild(row);
                overdueUnpaidTotal += totalAmount;
            }
        });

        // Update the total amounts
        document.getElementById('totalPaidAmount').textContent = `Total Paid Amount: ${formatAmount(paidTotal)}`;
        document.getElementById('totalUnpaidAmount').textContent = `Unpaid/Overdue Total: ${formatAmount(overdueUnpaidTotal)}`;
        document.getElementById('paidViolationsFilter').addEventListener('change', fetchApprehensionsData);
        document.getElementById('unpaidViolationsFilter').addEventListener('change', fetchApprehensionsData);

    } catch (error) {
        console.error('Error fetching apprehensions:', error);
    }
}



// Export to Excel
const exportXLS = async () => {
  try {
    const querySnapshot = await getDocs(collection(firestore, "apprehensions"));
    const data = [];
    querySnapshot.forEach((docSnapshot) => {
      const apprehensionData = docSnapshot.data();
      const violations =
        apprehensionData.selectedViolations &&
        Array.isArray(apprehensionData.selectedViolations)
          ? apprehensionData.selectedViolations
              .map((violation) => violation.name)
              .join(", ")
          : "N/A";

      data.push({
        "Full Name": apprehensionData.fullName || "N/A",
        "OR Number": apprehensionData.orNumber || "N/A",
        Status: apprehensionData.status || "N/A",
        Address: apprehensionData.address || "N/A",
        "Plate Number": apprehensionData.plateNumber || "N/A",
        "Vehicle Type": apprehensionData.vehicleType || "N/A",
        Violations: violations,
        Date:
          new Date(apprehensionData.timestamp * 1000).toLocaleDateString() ||
          "N/A",
        "Officer Apprehended": apprehensionData.officerApprehend || "N/A",
        "Total Amount": `₱${apprehensionData.totalAmount.toFixed(2)}`, // Added Peso sign
        Timestamp: apprehensionData.timestamp, // Include timestamp for sorting
      });
    });

    // Sort data by timestamp (most recent first)
    data.sort((a, b) => b.Timestamp - a.Timestamp);

    // Remove the timestamp field before exporting
    data.forEach((item) => delete item.Timestamp);

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Apprehensions");

    // Export the data as Excel file
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    XLSX.writeFile(workbook, `apprehensions_data_${formattedDate}.xlsx`);
  } catch (error) {
    console.error("Error exporting apprehensions: ", error);
  }
};

async function logHistory(actionType, details, additionalInfo = {}) {
  try {
    const auth = getAuth(); // Ensure getAuth is called correctly
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("No authenticated user found.");
    }

    console.log("Current user:", currentUser);

    const historyRef = collection(firestore, "historyLogs");
    const timestamp = new Date().toISOString();

    const historyData = {
      actionType,
      details,
      performedBy: currentUser.email, // Ensure performedBy is set
      timestamp,
      ...additionalInfo, // Include any additional info
    };

    if (historyData.totalPayment) {
      historyData.totalPayment = `₱${historyData.totalPayment.toFixed(2)}`;
    }

    console.log("Attempting to log history:", historyData);

    // Attempt to add a document to Firestore
    const docRef = await addDoc(historyRef, historyData);
    console.log("History logged successfully, Document ID:", docRef.id);

    // Fetch and refresh history logs
    await fetchHistoryLogs();
  } catch (error) {
    console.error("Error logging history:", error);
    alert("Failed to log history. Check console for details.");
  }
}

async function fetchHistoryLogs() {
  try {
    const historySnapshot = await getDocs(collection(firestore, "historyLogs"));
    const historyData = [];

    historySnapshot.forEach((docSnapshot) => {
      const log = docSnapshot.data();
      console.log("Fetched log:", log); // Debug log
      historyData.push(log);
    });

    const historyModalBody = document.getElementById("historyModalBody");
    historyModalBody.innerHTML = "";

    if (historyData.length > 0) {
      historyData.forEach((log) => {
        const logElement = document.createElement("div");
        logElement.className = "history-log-item p-2 mb-2 border-bottom";
        logElement.innerHTML = `
                    <strong>${log.actionType}</strong> - ${log.details} <br>
                    <small>By: ${log.performedBy || "Unknown"}</small><br>
                    ${
                      log.orNumber
                        ? `<small>OR Number: ${log.orNumber}</small><br>`
                        : ""
                    } 
                    ${
                      log.totalPayment
                        ? `<small>Total Payment: ${log.totalPayment}</small><br>`
                        : ""
                    } 
                    <small>${new Date(log.timestamp).toLocaleString()}</small>
                `;
        historyModalBody.appendChild(logElement);
      });
    } else {
      historyModalBody.innerHTML =
        '<p class="text-center text-muted">No history logs available.</p>';
    }
  } catch (error) {
    console.error("Error fetching history logs:", error);
  }
}

// Unified status and payment modal logic
function openStatusPaymentModal(docId, currentStatus, totalAmount) {
  selectedDocId = docId;
  selectedTotalAmount = totalAmount || 0; // Ensure totalAmount is assigned

  const statusSelect = document.getElementById("statusSelect");
  const paymentFields = document.getElementById("paymentFields");

  // Set the current status in the dropdown
  statusSelect.value = currentStatus;

  // Show or hide payment fields based on the status
  if (currentStatus === "paid") {
    paymentFields.classList.remove("d-none");
  } else {
    paymentFields.classList.add("d-none");
  }

  const modal = new bootstrap.Modal(
    document.getElementById("statusPaymentModal")
  );
  modal.show();
}

async function updateStatus(newStatus) {
  try {
    const docRef = doc(firestore, "apprehensions", selectedDocId);
    await updateDoc(docRef, { status: newStatus });

    const actionDetails = `Status changed to ${newStatus} for document ID: ${selectedDocId}`;

    // Call logHistory and confirm it's triggered
    console.log("Calling logHistory with details:", actionDetails);
    await logHistory("Status Change", actionDetails);

    console.log("Status updated and history logged successfully");

    fetchApprehensionsData(); // Re-fetch and update the table
  } catch (error) {
    console.error("Error updating status:", error);
  }
}

// Event listeners
document
  .getElementById("statusPaymentDoneBtn")
  .addEventListener("click", async () => {
    const selectedStatus = document.getElementById("statusSelect").value;
    const orNumber = document.getElementById("orNumber").value;
    const amount = parseFloat(document.getElementById("amount").value) || 0;

    console.log("Validation check:");
    console.log("OR Number:", orNumber);
    console.log("Amount:", amount);
    console.log("Selected Total Amount:", selectedTotalAmount);

    try {
      if (selectedStatus === "paid") {
        // Validate payment details
        if (!orNumber || amount <= 0 || amount !== selectedTotalAmount) {
          console.error("Validation failed");
          alert(
            "Invalid input. Ensure OR Number is provided and the amount matches."
          );
          return;
        }

        // Update payment details and status in Firestore
        await updateDoc(doc(firestore, "apprehensions", selectedDocId), {
          status: selectedStatus,
          orNumber: orNumber,
          totalAmount: amount,
        });

        await logHistory("Payment", `Payment of ${amount} made`, {
          orNumber,
          totalPayment: amount,
        });
      } else {
        await updateStatus(selectedStatus); // Call updateStatus for non-paid updates
      }

      fetchApprehensionsData();
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("statusPaymentModal")
      );
      modal.hide();
    } catch (error) {
      console.error("Error updating status or payment:", error);
    }
  });

document.getElementById("statusSelect").addEventListener("change", () => {
  const selectedStatus = document.getElementById("statusSelect").value;
  const paymentFields = document.getElementById("paymentFields");

  if (selectedStatus === "paid") {
    paymentFields.classList.remove("d-none");
  } else {
    paymentFields.classList.add("d-none");
  }
});

document.addEventListener("click", (event) => {
  if (event.target && event.target.classList.contains("change-status")) {
    const docId = event.target.getAttribute("data-id");
    const currentStatus = event.target.getAttribute("data-status");
    const totalAmount = parseFloat(event.target.getAttribute("data-total"));
    openStatusPaymentModal(docId, currentStatus, totalAmount);
  }

  if (event.target && event.target.classList.contains("view-details")) {
    const orNumber = event.target.getAttribute("data-or");
    const amount = formatAmount(
      parseFloat(event.target.getAttribute("data-amount"))
    );

    // Display payment details in an alert or modal
    alert(`Payment Details:\n\nOR Number: ${orNumber}\nAmount Paid: ${amount}`);
  }
});

document
  .getElementById("historyLogsBtn")
  .addEventListener("click", async () => {
    try {
      // Fetch history logs from Firestore
      const historySnapshot = await getDocs(
        collection(firestore, "historyLogs")
      );
      const historyData = [];

      historySnapshot.forEach((docSnapshot) => {
        const log = docSnapshot.data();
        historyData.push(log);
      });

      // Build HTML for the history logs
      const historyModalBody = document.getElementById("historyModalBody");
      historyModalBody.innerHTML = ""; // Clear existing logs

      if (historyData.length > 0) {
        historyData.forEach((log) => {
          const logElement = document.createElement("div");
          logElement.className = "history-log-item p-2 mb-2 border-bottom";
          logElement.innerHTML = `
                    <strong>${log.actionType}</strong> - ${log.details} <br>
                    <small>By: ${log.performedBy || "Unknown"}</small><br>
                    ${
                      log.orNumber
                        ? `<small>OR Number: ${log.orNumber}</small><br>`
                        : ""
                    }
                    ${
                      log.totalPayment
                        ? `<small>Total Payment: ${log.totalPayment}</small><br>`
                        : ""
                    }
                    <small>${new Date(log.timestamp).toLocaleString()}</small>
                `;
          historyModalBody.appendChild(logElement);
        });
      } else {
        historyModalBody.innerHTML =
          '<p class="text-center text-muted">No history logs available.</p>';
      }

      // Show the modal
      const historyModal = new bootstrap.Modal(
        document.getElementById("historyModal")
      );
      historyModal.show();
    } catch (error) {
      console.error("Error fetching history logs:", error);
      alert("Failed to fetch history logs.");
    }
  });

document.getElementById("exportXLS").addEventListener("click", exportXLS); // Add this line to use exportXLS

// Initialize the data on page load
onAuthStateChanged(getAuth(), (user) => {
  if (user) {
    fetchApprehensionsData();
  } else {
    console.error("No authenticated user found.");
  }
});


