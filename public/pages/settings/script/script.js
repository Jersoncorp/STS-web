// -------------------------------------------------- Firebase Imports
import { auth, firestore, storage } from '../../../resources/script/config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { uploadBytes, getDownloadURL, ref } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// Function to load the currently logged-in user's data
async function loadUserProfile(user) {
    if (!user) {
        console.log("No user provided to loadUserProfile"); // Debugging line
        return;
    }

    try {
        const userDoc = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            // Populate the form with user data
            document.getElementById('firstName').value = userData.firstName || '';
            document.getElementById('lastName').value = userData.lastName || '';
            document.getElementById('birthdate').value = userData.birthdate || '';
            document.getElementById('gender').value = userData.gender || '';
            document.getElementById('address').value = userData.address || '';

            // Load the profile picture
            const profilePictureImg = document.querySelector('img[alt="Profile Placeholder"]');
            if (userData.profilePicture) {
                profilePictureImg.src = userData.profilePicture;
            }
        } else {
            console.log("No user data found in Firestore for UID:", user.uid);
        }
    } catch (error) {
        console.error("Error fetching user data: ", error);
        Swal.fire({
            title: 'Error!',
            text: 'Could not load user data.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

// -------------------------------------------------- Authentication State Listener
function setupAuthListener() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('User is logged in:', user.uid); // Debugging log
            loadUserProfile(user); // Load profile for the logged-in user
        } else {
            Swal.fire('Error', 'No user is logged in.', 'error');
        }
    });
}

// -------------------------------------------------- Handle Profile Update
async function handleProfileUpdate(event) {
    event.preventDefault();
    const form = event.target;
    
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const user = auth.currentUser;
    if (user) {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const birthdate = document.getElementById('birthdate').value;
        const gender = document.getElementById('gender').value;
        const address = document.getElementById('address').value;
        const profilePictureFile = document.getElementById('profilePicture').files[0];

        try {
            const userRef = doc(firestore, 'users', user.uid);
            let profilePictureURL = ''; // default value

            // Handle profile picture upload if a new one is selected
            if (profilePictureFile) {
                const storageRef = ref(storage, `profilePictures/${user.uid}/${profilePictureFile.name}`);
                await uploadBytes(storageRef, profilePictureFile);
                profilePictureURL = await getDownloadURL(storageRef);
            }

            // Update user profile in Firestore
            await updateDoc(userRef, {
                firstName,
                lastName,
                birthdate,
                gender,
                address,
                ...(profilePictureURL && { profilePicture: profilePictureURL }) // Update if picture exists
            });

            Swal.fire({
                title: 'Success!',
                text: 'Profile updated successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            });

            loadUserProfile(user); // Reload user data to reflect changes
            form.reset(); // Reset form after success

        } catch (error) {
            console.error("Error updating user data: ", error);
            Swal.fire({
                title: 'Error!',
                text: 'There was an error updating your profile.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } else {
        Swal.fire('Error', 'No user is logged in.', 'error');
    }
}

// -------------------------------------------------- Handle Password Change
async function handleChangePassword(event) {
    event.preventDefault();
    const form = event.target;

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const user = auth.currentUser;
    if (user) {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            Swal.fire({
                title: 'Error!',
                text: 'New passwords do not match.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        try {
            // Reauthenticate user with their old password
            const credential = EmailAuthProvider.credential(user.email, oldPassword);
            await reauthenticateWithCredential(user, credential);

            // Update to the new password
            await updatePassword(user, newPassword);

            Swal.fire({
                title: 'Success!',
                text: 'Password changed successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            });

            form.reset(); // Reset form after success

        } catch (error) {
            console.error("Error changing password: ", error);
            Swal.fire({
                title: 'Error!',
                text: 'There was an error changing your password.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    } else {
        Swal.fire('Error', 'No user is logged in.', 'error');
    }
}

// -------------------------------------------------- Initialize the page
function init() {
    console.log("Initializing profile settings page...");
    setupAuthListener(); // Setup the auth listener before anything else
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);
}

// -------------------------------------------------- Start initialization
window.addEventListener('DOMContentLoaded', init); // Ensure initialization happens after DOM is ready
