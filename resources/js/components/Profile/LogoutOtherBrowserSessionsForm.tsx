import { useForm } from '@inertiajs/inertia-react';
import React, { useState } from 'react';
import { Modal, ModalBody, ModalFoot } from '@/Components/Modal';
import Button from '@/Components/Button';
import Input from '@/Components/Input';

export default function LogoutOtherBrowserSessions({ sessions }) {
	const [confirmingLogout, setConfirmingLogout] = useState(false);
	const form = useForm({ password: '' });

	function confirmLogout() {
		setConfirmingLogout(true);
	}

	function logoutOtherBrowserSessions() {
		form.delete(route('other-browser-sessions.destroy'), {
			preserveScroll: true,
			preserveState: true,
			onSuccess: () => closeModal(),
			onFinish: () => form.reset()
		});
	}

	function closeModal() {
		form.reset();
		form.clearErrors();
		setConfirmingLogout(false);
	}

	return (
		<>
			<div className="max-w-xl text-sm text-gray-300">
				If necessary, you may log out of all of your other browser sessions
				across all of your devices. Some of your recent sessions are listed
				below; however, this list may not be exhaustive. If you feel your
				account has been compromised, you should also update your password.
			</div>

			{/* <!-- Other Browser Sessions --> */}
			{sessions.length > 0 ? (
				<div className="mt-5 space-y-6">
					{sessions.map((session, i) => (
						<div className="flex items-center" key={i}>
							<div>
								{session.agent.is_desktop ? (
									<svg
										fill="none"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										viewBox="0 0 24 24"
										stroke="currentColor"
										className="w-8 h-8 text-gray-200"
									>
										<path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
									</svg>
								) : (
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										strokeWidth="2"
										stroke="currentColor"
										fill="none"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="w-8 h-8 text-gray-200"
									>
										<path d="M0 0h24v24H0z" stroke="none"></path>
										<rect x="7" y="4" width="10" height="16" rx="1"></rect>
										<path d="M11 5h2M12 17v.01"></path>
									</svg>
								)}
							</div>

							<div className="ml-3">
								<div className="text-sm text-gray-300">
									{session.agent.platform} - {session.agent.browser}
								</div>

								<div>
									<div className="text-xs text-gray-200">
										{session.ip_address}, {session.is_current_device ? (
											<span className="text-green-500 font-semibold">
												This device
											</span>
										) : (
											<span>Last active {session.last_active}</span>
										)}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			) : null}

			<div className="flex items-center mt-5">
				<Button type="button" onClick={confirmLogout}>Log Out Other Browser Sessions</Button>
			</div>

			{/* <!-- Log Out Other Devices Confirmation Modal --> */}
			<Modal show={confirmingLogout} close={closeModal} width="max-w-xl">
				<ModalBody>
					<p>
						Please enter your password to confirm you would like to log out of
						your other browser sessions across all of your devices.
					</p>
					<div className="mt-4">
						<Input
							type="password"
							className="mt-1 block w-full"
							placeholder="Password"
							value={form.data.password}
							handleChange={e => form.setData('password', e.currentTarget.value)}
							errors={form.errors.password}
						/>
					</div>
				</ModalBody>
				<ModalFoot>
					<Button type="button" theme="secondary" onClick={closeModal}>Cancel</Button>

					<Button
						type="button"
						onClick={logoutOtherBrowserSessions}
						className={`ml-2 ${form.processing ? 'opacity-25' : ''}`}
						processing={form.processing}
					>
						Log Out Other Browser Sessions
					</Button>
				</ModalFoot>
			</Modal>
		</>
	);
}
