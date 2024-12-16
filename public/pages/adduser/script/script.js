import { firestore, auth, storage } from '../../../resources/script/config.js';
import { collection, getDocs, setDoc, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

// Reference the users collection in Firestore
const usersCollection = collection(firestore, 'users');

// Function to fetch users from Firestore and populate the table
const loadUsers = async () => {
    try {
        const querySnapshot = await getDocs(usersCollection);
        populateUserTable(querySnapshot);
    } catch (error) {
        console.error("Error fetching users: ", error);
    }
};

// Function to populate the user table dynamically
const populateUserTable = (querySnapshot) => {
    const userTableBody = document.getElementById('userTableBody');
    userTableBody.innerHTML = '';

    querySnapshot.forEach((doc) => {
        const userData = doc.data();

        const row = document.createElement('tr');

        // Profile Picture
        const profilePicCell = document.createElement('td');
        const img = document.createElement('img');
        img.src = userData.profilePicture || '../../resources/ico/ico.png';
        img.alt = 'Profile Picture';
        img.style.maxWidth = '24px';
        profilePicCell.appendChild(img);
        row.appendChild(profilePicCell);

        // Name
        const nameCell = document.createElement('td');
        nameCell.textContent = `${userData.firstName} ${userData.lastName}`;
        row.appendChild(nameCell);

        // Email
        const emailCell = document.createElement('td');
        emailCell.textContent = userData.email || 'N/A';
        row.appendChild(emailCell);

        // Birthdate
        const birthdateCell = document.createElement('td');
        birthdateCell.textContent = userData.birthdate || 'N/A';
        row.appendChild(birthdateCell);

        // Gender
        const genderCell = document.createElement('td');
        genderCell.textContent = userData.gender || 'N/A';
        row.appendChild(genderCell);

        // Address
        const addressCell = document.createElement('td');
        addressCell.textContent = userData.address || 'N/A';
        row.appendChild(addressCell);

        // Position
        const positionCell = document.createElement('td');
        positionCell.textContent = userData.position || 'N/A';
        row.appendChild(positionCell);

        // Actions cell
        const actionsCell = document.createElement('td');

        // Edit button
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-warning btn-sm me-1';
        editButton.innerHTML = '<i class="lni lni-pencil"></i>'; 
        editButton.onclick = () => editUser(doc.id, userData);
        actionsCell.appendChild(editButton);

        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm me-1';
        deleteButton.innerHTML = '<i class="lni lni-trash-can"></i>';
        deleteButton.onclick = () => deleteUser(doc.id); 
        actionsCell.appendChild(deleteButton);

        row.appendChild(actionsCell);

        // Append row to the table body
        userTableBody.appendChild(row);
    });
};

// Add event listener to the Add User form
const handleAddUserForm = async (event) => {
    event.preventDefault();

    const form = event.target;
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You are about to add a new user.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, add user!',
        cancelButtonText: 'No, cancel',
    });

    if (result.isConfirmed) {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const birthdate = document.getElementById('birthdate').value;
        const gender = document.getElementById('gender').value;
        const address = document.getElementById('address').value;
        const position = document.getElementById('position').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const profilePictureFile = document.getElementById('profilePicture').files[0];

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            let profilePictureURL = '';
            if (profilePictureFile) {
                const storageRef = ref(storage, `profilePictures/${user.uid}/${profilePictureFile.name}`);
                await uploadBytes(storageRef, profilePictureFile);
                profilePictureURL = await getDownloadURL(storageRef);
            }

            const userRef = doc(firestore, 'users', user.uid); 
            await setDoc(userRef, {
                firstName,
                lastName,
                email,
                birthdate,
                gender,
                address,
                position,
                uid: user.uid,
                profilePicture: profilePictureURL,
            });

            loadUsers();

            const addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));
            addUserModal.hide();

            form.reset();
            form.classList.remove('was-validated');

            Swal.fire({
                title: 'Success!',
                text: 'User has been added successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            });

        } catch (error) {
            console.error("Error adding user: ", error);
            Swal.fire({
                title: 'Error!',
                text: 'There was an error adding the user.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
};

// Initialization function
const init = () => {
    console.log("Initializing the page...");
    loadUsers();
    document.getElementById('addUserForm').addEventListener('submit', handleAddUserForm);
};

// Call the init function
init();


// Function to edit user data
const editUser = (userId, userData) => {
    document.getElementById('editFirstName').value = userData.firstName;
    document.getElementById('editLastName').value = userData.lastName;
    document.getElementById('editAddress').value = userData.address;
    document.getElementById('editGender').value = userData.gender;
    document.getElementById('editPosition').value = userData.position;

    const editDataModal = new bootstrap.Modal(document.getElementById('editUserModal'));
    editDataModal.show();

    const editDataForm = document.getElementById('editDataForm');
    editDataForm.onsubmit = async (event) => {
        event.preventDefault();

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You are about to update this user's information.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, update it!',
            cancelButtonText: 'No, cancel',
        });

        if (result.isConfirmed) {
            const firstName = document.getElementById('editFirstName').value;
            const lastName = document.getElementById('editLastName').value;
            const address = document.getElementById('editAddress').value;
            const gender = document.getElementById('editGender').value;
            const position = document.getElementById('editPosition').value;
            const profilePictureFile = document.getElementById('editProfilePicture').files[0];

            try {
                const userRef = doc(firestore, 'users', userId);
                let profilePictureURL = userData.profilePicture;

                // If a new profile picture is uploaded, update Firebase Storage
                if (profilePictureFile) {
                    const storageRef = ref(storage, `profilePictures/${userId}/${profilePictureFile.name}`);
                    await uploadBytes(storageRef, profilePictureFile);
                    profilePictureURL = await getDownloadURL(storageRef);
                }

                // Update the user document in Firestore
                await updateDoc(userRef, {
                    firstName,
                    lastName,
                    address,
                    gender,
                    position,
                    profilePicture: profilePictureURL,
                });

                loadUsers(); // Refresh the user table
                editDataModal.hide();

                Swal.fire({
                    title: 'Updated!',
                    text: 'User data has been updated successfully.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            } catch (error) {
                console.error("Error updating user: ", error);
                Swal.fire({
                    title: 'Error!',
                    text: 'There was an error updating the user.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        }
    };
};

// Function to delete a user
const deleteUser = async (userId) => {
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
            const userRef = doc(firestore, 'users', userId);

            // Delete the user document from Firestore
            await deleteDoc(userRef);

            loadUsers(); // Refresh the user table

            Swal.fire({
                title: 'Deleted!',
                text: 'User has been deleted.',
                icon: 'success',
                confirmButtonText: 'OK'
            });

        } catch (error) {
            console.error("Error deleting user: ", error);
            Swal.fire({
                title: 'Error!',
                text: 'There was an error deleting the user.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
};
