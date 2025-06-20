import { Inertia } from '@inertiajs/inertia';
import { useForm, usePage } from '@inertiajs/inertia-react';
import React, { useRef, useState } from 'react';
import Input from '@/Components/Input';
import InputError from '@/Components/InputError';
import Label from '@/Components/Label';
import Button from '@/Components/Button';

export default function UpdateProfileInformationForm({ user }) {
	const form = useForm({
		_method: 'PUT',
		name: user.name,
		email: user.email,
		photo: null
	});

	const [photoPreview, setPhotoPreview] = useState(null);
	const photoRef = useRef(null);
	const page = usePage();

	function updateProfileInformation(e) {
		e.preventDefault();
		form.post(route('user-profile-information.update'), {
			errorBag: 'updateProfileInformation',
			preserveScroll: true,
			preserveState: true,
			onSuccess: (page) => {
				clearPhotoFileInput();
				const verified = page.props.use.email_verified_at;
				if (verified == '' || verified == null || !verified) {
					Inertia.visit(route('verification.notice'));
				}
			}
		});
	}

	function selectNewPhoto() {
		photoRef.current?.click();
	}

	function updatePhotoPreview() {
		const photo = photoRef.current?.files?.[0];

		if (!photo) {
			return;
		}

		form.setData('photo', photo);

		const reader = new FileReader();

		reader.onload = e => {
			setPhotoPreview(e.target?.result);
		};

		reader.readAsDataURL(photo);
	}

	function deletePhoto() {
		Inertia.delete(route('current-user-photo.destroy'), {
			preserveScroll: true,
			onSuccess: () => {
				setPhotoPreview(null);
				clearPhotoFileInput();
			},
		});
	}

	function clearPhotoFileInput() {
		if (photoRef.current?.value) {
			photoRef.current.value = '';
			form.setData('photo', null);
		}
	}

	return (
		<div className="md:grid md:grid-cols-3 md:gap-6">
			<div className="md:col-span-1">
				<div className="px-4 sm:px-0">
					<h3 className="text-lg font-medium text-gray-100">Profile Information</h3>

					<p className="mt-1 text-sm text-gray-300">Update your account's profile information and email address.</p>
				</div>
			</div>
			<div className="mt-5 md:mt-0 md:col-span-2">
				<form onSubmit={updateProfileInformation}>
					{/* <!-- Profile Photo --> */}
					{page.props.jetstream.managesProfilePhotos ? (
						<div className="col-span-6 sm:col-span-4">
							{/* <!-- Profile Photo File Input --> */}
							<input
								type="file"
								className="hidden"
								ref={photoRef}
								onChange={updatePhotoPreview}
							/>

							<Label forInput="photo" className="leading-7 text-sm text-gray-100" value="Photo" />

							{photoPreview ? (
								// <!-- New Profile Photo Preview -->
								<div className="mt-2">
									<span
										className="block rounded-full w-20 h-20"
										style={{
											backgroundSize: 'cover',
											backgroundRepeat: 'no-repeat',
											backgroundPosition: 'center center',
											backgroundImage: `url('${photoPreview}')`,
										}}
									></span>
								</div>
							) : (
								// <!-- Current Profile Photo -->
								<div className="mt-2">
									<img
										src={user.profile_photo_url}
										alt={user.name}
										className="rounded-full h-20 w-20 object-cover"
									/>
								</div>
							)}

							<Button
								className="mt-2 mr-2"
								type="button"
								theme="secondary"
								onClick={selectNewPhoto}
							>
								Select A New Photo
							</Button>

							{user.profile_photo_path ? (
								<Button
									type="button"
									theme="secondary"
									className="mt-2"
									onClick={deletePhoto}
								>
									Remove Photo
								</Button>
							) : null}

							<InputError errors={form.errors.photo} />
						</div>
					) : null}

					{/* <!-- Name --> */}
					<div className="col-span-6 sm:col-span-4 mt-2">
						<Label forInput="name" className="leading-7 text-sm text-gray-100" value="Name" />
						<Input
							type="text"
							name="name"
							className="mt-1 block w-full"
							autoComplete="name"
							value={form.data.name}
							handleChange={(e) => form.setData('name', e.currentTarget.value)}
							errors={form.errors.name}
						/>
					</div>

					{/* <!-- Email --> */}
					<div className="col-span-6 sm:col-span-4 mt-2">
						<Label forInput="email" className="leading-7 text-sm text-gray-100" value="Email" />
						<Input
							type="email"
							name="email"
							className="mt-1 block w-full"
							autoComplete="email"
							value={form.data.email}
							handleChange={(e) => form.setData('email', e.currentTarget.value)}
							errors={form.errors.email}
						/>
					</div>
					<div className="flex items-center justify-end py-3 text-right">
						<Button type="submit" processing={form.processing} className={form.processing ? 'opacity-25' : ''}>Save</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
