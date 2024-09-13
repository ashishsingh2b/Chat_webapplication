import React, { useState, useEffect } from 'react';
import ApiEndpoints from '../../../api/apiEndpoints';
import { useHistory, useParams } from 'react-router-dom';

const UserProfilePage = () => {
    const [userData, setUserData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        bio: '',
        phone_number: '',
        image: null, // Changed to null for better file handling
    });
    const [loading, setLoading] = useState(true); // Added loading state
    const [error, setError] = useState(null); // Added error state
    const history = useHistory(); // useHistory hook for navigation
    const { id } = useParams(); // Get user ID from route parameters

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${ApiEndpoints.PROFILE_URL}${id}/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                } else {
                    const errorText = await response.text();
                    console.error('Failed to fetch user data:', errorText);
                    setError('Failed to fetch user data.');
                }
            } catch (error) {
                console.error('There was an error fetching the user data!', error);
                setError('There was an error fetching the user data.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setUserData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleFileChange = (event) => {
        setUserData((prevState) => ({
            ...prevState,
            image: event.target.files[0], // Update the file in state
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append('first_name', userData.first_name);
        formData.append('last_name', userData.last_name);
        formData.append('email', userData.email);
        formData.append('bio', userData.bio);
        formData.append('phone_number', userData.phone_number);
        if (userData.image) {
            formData.append('image', userData.image); // Append the file if present
        }

        try {
            const response = await fetch(`${ApiEndpoints.PROFILE_URL}${id}/`, {
                method: 'PUT',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    // 'Content-Type': 'multipart/form-data' is not needed as fetch handles it
                },
            });

            if (response.ok) {
                alert('Profile updated successfully!');
                history.push('/profile'); // Redirect to profile page or any other page
            } else {
                const errorText = await response.text();
                console.error('Failed to update profile:', errorText);
                setError('Failed to update profile.');
            }
        } catch (error) {
            console.error('There was an error updating the profile!', error);
            setError('There was an error updating the profile.');
        }
    };

    if (loading) {
        return <div>Loading...</div>; // Show a loading indicator
    }

    return (
        <div>
            <h1>Profile</h1>
            {error && <div style={{ color: 'red' }}>{error}</div>} {/* Display error messages */}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                        First Name:
                        <input
                            type="text"
                            name="first_name"
                            value={userData.first_name}
                            onChange={handleChange}
                            required
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Last Name:
                        <input
                            type="text"
                            name="last_name"
                            value={userData.last_name}
                            onChange={handleChange}
                            required
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Email:
                        <input
                            type="email"
                            name="email"
                            value={userData.email}
                            onChange={handleChange}
                            required
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Bio:
                        <textarea
                            name="bio"
                            value={userData.bio}
                            onChange={handleChange}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Phone Number:
                        <input
                            type="text"
                            name="phone_number"
                            value={userData.phone_number}
                            onChange={handleChange}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Image:
                        <input
                            type="file"
                            name="image"
                            onChange={handleFileChange}
                        />
                    </label>
                </div>
                <div>
                    <button type="submit">Update Profile</button>
                </div>
            </form>
        </div>
    );
};

export default UserProfilePage;
