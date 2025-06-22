import { Component, Show } from 'solid-js';
import UpdateProfileInformationForm from './Profile/UpdateProfileInformationForm';
import UpdatePasswordForm from './Profile/UpdatePasswordForm';

const Profile: Component = () => {
	return (
		<>
			<div class="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
				<Show when={false}>
					<div>
						<UpdateProfileInformationForm />

						<div class="hidden sm:block">
							<div class="py-8">
								<div class="border-t border-gray-200"></div>
							</div>
						</div>
					</div>
				</Show>

				<div class="mt-10 sm:mt-0">
					<UpdatePasswordForm />
				</div>
			</div>
		</>
	);
};

export default Profile;
