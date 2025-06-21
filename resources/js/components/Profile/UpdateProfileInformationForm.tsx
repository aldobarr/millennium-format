import { Component, createSignal, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { AppContext } from "../../App";
import { Input } from "../ui/Input";
import Button from "../ui/Button";
import Label from "../ui/Label";

const UpdateProfileInformationForm: Component = () => {
	const [status, setStatus] = createSignal<boolean>(false);
	const [profileForm, setProfileForm] = createStore({ name: '', email: '', photo: null });
	const [errors, setErrors] = createStore<Record<string, string[]>>({});
	const [processing, setProcessing] = createSignal(false);
	const { appState } = useContext(AppContext);

	return (
		<div class="md:grid md:grid-cols-3 md:gap-6">
			<div class="md:col-span-1">
				<div class="px-4 sm:px-0">
					<h3 class="text-lg font-medium text-gray-100">Profile Information</h3>

					<p class="mt-1 text-sm text-gray-300">Update your account's profile information and email address.</p>
				</div>
			</div>
			<div class="mt-5 md:mt-0 md:col-span-2">
				<form onSubmit={() => {}}>
					<div class="col-span-6 sm:col-span-4 mt-2">
						<Label for="name" class="leading-7 text-sm text-gray-100" value="Name" />
						<Input
							type="text"
							name="name"
							class="mt-1 block w-full"
							value={profileForm.name}
							handleChange={(e: any) => setProfileForm('name', e.currentTarget.value)}
							errors={() => errors.name}
						/>
					</div>
					<div class="col-span-6 sm:col-span-4 mt-2">
						<Label for="email" class="leading-7 text-sm text-gray-100" value="Email" />
						<Input
							type="email"
							name="email"
							class="mt-1 block w-full"
							value={profileForm.email}
							handleChange={(e: any) => setProfileForm('email', e.currentTarget.value)}
							errors={() => errors.email}
						/>
					</div>
					<div class="flex items-center justify-end py-3 text-right">
						<Button type="submit" processing={processing} class={processing() ? 'opacity-25' : ''}>Save</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default UpdateProfileInformationForm;