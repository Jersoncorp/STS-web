import { firestore, storage } from '../../../resources/script/config.js';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

// Reference to the registered_drivers collection in Firestore
const driversCollection = collection(firestore, 'registered_drivers');

// Function to fetch drivers from Firestore and populate the table
const loadDrivers = async () => {
    try {
        const querySnapshot = await getDocs(driversCollection);
        populateDriversTable(querySnapshot);
    } catch (error) {
        console.error("Error fetching drivers: ", error);
    }
};

// Function to populate the table with driver data
const populateDriversTable = (querySnapshot) => {
    const dataTableBody = document.getElementById('dataTableBody');
    dataTableBody.innerHTML = '';

    querySnapshot.forEach((doc) => {
        const driverData = doc.data();

        const row = document.createElement('tr');

        // Driver Image
        const imgCell = document.createElement('td');
        const img = document.createElement('img');
        img.src = driverData.image || '../../resources/ico/ico.png';
        img.alt = 'Driver Image';
        img.style.maxWidth = '24px';
        imgCell.appendChild(img);
        row.appendChild(imgCell);

        // Driver Name
        const nameCell = document.createElement('td');
        nameCell.textContent = `${driverData.firstName} ${driverData.lastName}`;
        row.appendChild(nameCell);

        // License Number
        const licenseCell = document.createElement('td');
        licenseCell.textContent = driverData.licensedNumber || 'N/A';
        row.appendChild(licenseCell);

        // Address
        const addressCell = document.createElement('td');
        addressCell.textContent = driverData.address || 'N/A';
        row.appendChild(addressCell);

        // Sex
        const sexCell = document.createElement('td');
        sexCell.textContent = driverData.sex || 'N/A';
        row.appendChild(sexCell);

         // Actions cell
         const actionsCell = document.createElement('td');

         // Edit button
         const editButton = document.createElement('button');
         editButton.className = 'btn btn-warning btn-sm me-1';
         editButton.innerHTML = '<i class="lni lni-pencil"></i>'; 
         editButton.onclick = () => editDriver(doc.id, driverData);
         actionsCell.appendChild(editButton);
 
         // Delete button
         const deleteButton = document.createElement('button');
         deleteButton.className = 'btn btn-danger btn-sm me-1';
         deleteButton.innerHTML = '<i class="lni lni-trash-can"></i>';
         deleteButton.onclick = () => deleteDriver(doc.id, driverData); 
         actionsCell.appendChild(deleteButton);
 
         row.appendChild(actionsCell);

        dataTableBody.appendChild(row);
    });
};

// Add event listener to the Add Data form
const handleAddDriverForm = async (event) => {
    event.preventDefault();
    const form = event.target;

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const licensedNumber = document.getElementById('licenseNumber').value;
    const address = document.getElementById('address').value;
    const sex = document.getElementById('sex').value;
    const profilePictureFile = document.getElementById('profilePicture').files[0];

    licensedNumber = licensedNumber.toUpperCase();

    try {
        let profilePictureURL = '';
        if (profilePictureFile) {
            const storageRef = ref(storage, `driverImages/${licensedNumber}/${profilePictureFile.name}`);
            await uploadBytes(storageRef, profilePictureFile);
            profilePictureURL = await getDownloadURL(storageRef);
        }

        await addDoc(driversCollection, {
            firstName,
            lastName,
            licensedNumber,
            address,
            sex,
            image: profilePictureURL,
        });

        loadDrivers();
        form.reset();
        form.classList.remove('was-validated');

        const addDataModal = new bootstrap.Modal(document.getElementById('addDataModal'));
        addDataModal.hide();

        Swal.fire({
            title: 'Success!',
            text: 'Driver has been added successfully.',
            icon: 'success',
            confirmButtonText: 'OK'
        });

    } catch (error) {
        console.error("Error adding driver: ", error);
        Swal.fire({
            title: 'Error!',
            text: 'There was an error adding the driver.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
};

// Function to edit driver data
const editDriver = (driverId, driverData) => {
    document.getElementById('editFirstName').value = driverData.firstName;
    document.getElementById('editLastName').value = driverData.lastName;
    document.getElementById('editLicenseNumber').value = driverData.licensedNumber;
    document.getElementById('editAddress').value = driverData.address;
    document.getElementById('editSex').value = driverData.sex;

    const editDataModal = new bootstrap.Modal(document.getElementById('editDataModal'));
    editDataModal.show();

    const editDataForm = document.getElementById('editDataForm');
    editDataForm.onsubmit = async (event) => {
        event.preventDefault();

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You are about to update this driver's information.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, update it!',
            cancelButtonText: 'No, cancel',
        });

        if (result.isConfirmed) {
            const firstName = document.getElementById('editFirstName').value;
            const lastName = document.getElementById('editLastName').value;
            const licenseNumber = document.getElementById('editLicenseNumber').value;
            const address = document.getElementById('editAddress').value;
            const sex = document.getElementById('editSex').value;
            const profilePictureFile = document.getElementById('editProfilePicture').files[0];

            licensedNumber = licensedNumber.toUpperCase();

            try {
                const driverRef = doc(firestore, 'registered_drivers', driverId);
                let profilePictureURL = driverData.image;

                if (profilePictureFile) {
                    const storageRef = ref(storage, `driverImages/${licenseNumber}/${profilePictureFile.name}`);
                    await uploadBytes(storageRef, profilePictureFile);
                    profilePictureURL = await getDownloadURL(storageRef);
                }

                await updateDoc(driverRef, {
                    firstName,
                    lastName,
                    licensedNumber,
                    address,
                    sex,
                    image: profilePictureURL,
                });

                loadDrivers();
                editDataModal.hide();

                Swal.fire({
                    title: 'Updated!',
                    text: 'Driver data has been updated successfully.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            } catch (error) {
                console.error("Error updating driver: ", error);
                Swal.fire({
                    title: 'Error!',
                    text: 'There was an error updating the driver.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        }
    };
};

// Function to delete a driver
const deleteDriver = async (driverId, driverData) => {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel',
    });

    if (result.isConfirmed) {
        try {
            const driverRef = doc(firestore, 'registered_drivers', driverId);

            // Delete driver document from Firestore
            await deleteDoc(driverRef);

            loadDrivers();
            
            Swal.fire({
                title: 'Deleted!',
                text: 'Driver has been deleted.',
                icon: 'success',
                confirmButtonText: 'OK'
            });

        } catch (error) {
            console.error("Error deleting driver: ", error);
            Swal.fire({
                title: 'Error!',
                text: 'There was an error deleting the driver.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
};

// Function to export drivers to Excel
const exportXLS = async () => {
    try {
        const querySnapshot = await getDocs(driversCollection);

        const data = [];
        querySnapshot.forEach((doc) => {
            const driverData = doc.data();
            data.push({
                "First Name": driverData.firstName,
                "Last Name": driverData.lastName,
                "License Number": driverData.licensedNumber || 'N/A',
                "Address": driverData.address || 'N/A',
                "Sex": driverData.sex || 'N/A'
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Drivers");

        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; 

        // Export the workbook to an Excel file with the date in the name
        XLSX.writeFile(workbook, `drivers_data_${formattedDate}.xlsx`);
    } catch (error) {
        console.error("Error exporting drivers: ", error);
    }
};

// Add event listener to the export button
document.getElementById('exportXLS').addEventListener('click', exportXLS);

// Initialization function
const init = () => {
    loadDrivers();
    document.getElementById('addDataForm').addEventListener('submit', handleAddDriverForm);
};

// Call the init function on page load
init();
