import { Component } from 'solid-js';
import UpdatePasswordForm from './profile/UpdatePasswordForm';

const Profile: Component = () => {
	return (
		<>
			<div class="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
				<div class="mt-10 sm:mt-0">
					<UpdatePasswordForm />
				</div>
			</div>
		</>
	);
};

export default Profile;
