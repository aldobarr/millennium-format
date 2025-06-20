import { Inertia } from '@inertiajs/inertia';
import { useForm, usePage } from '@inertiajs/inertia-react';
import axios from 'axios';
import React, { useState } from 'react';
import ConfirmsPassword from '@/Components/ConfirmsPassword';
import Input from '@/Components/Input';
import Label from '@/Components/Label';
import Button from '@/Components/Button';

export default function TwoFactorAuthenticationForm({ requiresConfirmation }) {
	const page = usePage();
	const [enabling, setEnabling] = useState(false);
	const [disabling, setDisabling] = useState(false);
	const [qrCode, setQrCode] = useState(null);
	const [recoveryCodes, setRecoveryCodes] = useState([]);
	const [confirming, setConfirming] = useState(false);
	const [setupKey, setSetupKey] = useState(null);
	const confirmationForm = useForm({ code: '' });
	const twoFactorEnabled = !enabling && page.props?.user?.two_factor_enabled;

	function enableTwoFactorAuthentication() {
		Inertia.post(
			'/user/two-factor-authentication',
			{},
			{
				preserveScroll: true,
				preserveState: true,
				onSuccess() {
					return Promise.all([
						showQrCode(),
						showSetupKey(),
						showRecoveryCodes(),
					]);
				},
				onFinish() {
					setEnabling(false);
					setConfirming(requiresConfirmation);
				}
			}
		);
	}

	function showSetupKey() {
		return axios.get('/user/two-factor-secret-key').then(response => {
			setSetupKey(response.data.secretKey);
		});
	}

	function confirmTwoFactorAuthentication() {
		confirmationForm.post('/user/confirmed-two-factor-authentication', {
			preserveScroll: true,
			preserveState: true,
			errorBag: 'confirmTwoFactorAuthentication',
			onSuccess: () => {
				setConfirming(false);
				setQrCode(null);
				setSetupKey(null);
			},
		});
	}

	function showQrCode() {
		return axios.get('/user/two-factor-qr-code').then(response => {
			setQrCode(response.data.svg);
		});
	}

	function showRecoveryCodes() {
		return axios.get('/user/two-factor-recovery-codes').then(response => {
			setRecoveryCodes(response.data);
		});
	}

	function regenerateRecoveryCodes() {
		axios.post('/user/two-factor-recovery-codes').then(() => {
			showRecoveryCodes();
		});
	}

	function disableTwoFactorAuthentication() {
		setDisabling(true);

		Inertia.delete('/user/two-factor-authentication', {
			preserveScroll: true,
			preserveState: true,
			onSuccess() {
				setDisabling(false);
				setConfirming(false);
			}
		});
	}

	return (
		<>
			{(() => {
				if (twoFactorEnabled && !confirming) {
					return (
						<h3 className="text-lg font-medium text-gray-100">
							You have enabled two factor authentication.
						</h3>
					);
				}
				if (confirming) {
					return (
						<h3 className="text-lg font-medium text-gray-100">
							Finish enabling two factor authentication.
						</h3>
					);
				}
				return (
					<h3 className="text-lg font-medium text-gray-100">
						You have not enabled two factor authentication.
					</h3>
				);
			})()}

			<div className="mt-3 max-w-xl text-sm text-gray-300">
				<p>
					When two factor authentication is enabled, you will be prompted for a
					secure, random token during authentication. You may retrieve this
					token from your phone's TOTP Authenticator application.
					We recommend using Aegis Authenticator.
				</p>
			</div>

			{twoFactorEnabled || confirming ? (
				<div>
					{qrCode ? (
						<div>
							<div className="mt-4 max-w-xl text-sm text-gray-300">
								{confirming ? (
									<p className="font-semibold">
										To finish enabling two factor authentication, scan the
										following QR code using your phone's authenticator
										application or enter the setup key and provide the generated
										OTP code.
									</p>
								) : (
									<p>
										Two factor authentication is now enabled. Scan the following
										QR code using your phone's authenticator application or
										enter the setup key.
									</p>
								)}
							</div>

							<div
								className="mt-4"
								dangerouslySetInnerHTML={{ __html: qrCode || '' }}
							/>

							{setupKey && (
								<div className="mt-4 max-w-xl text-sm text-gray-300">
									<p className="font-semibold">
										Setup Key:{' '}
										<span
											dangerouslySetInnerHTML={{ __html: setupKey || '' }}
										/>
									</p>
								</div>
							)}

							{confirming && (
								<div className="mt-4">
									<Label forInput="code" className="leading-7 text-sm text-gray-100" value="Code" />
									<Input
										type="number"
										name="code"
										className="mt-1 block w-1/2"
										autoFocus={true}
										autoComplete="off"
										value={confirmationForm.data.code}
										handleChange={(e) => confirmationForm.setData('code', e.currentTarget.value)}
										errors={confirmationForm.errors.code}
									/>
								</div>
							)}
						</div>
					) : null}

					{recoveryCodes.length > 0 && !confirming ? (
						<div>
							<div className="mt-4 max-w-xl text-sm text-gray-300">
								<p className="font-semibold">
									Store these recovery codes in a secure password manager. They
									can be used to recover access to your account if your two
									factor authentication device is lost.
								</p>
							</div>

							<div className="grid gap-1 max-w-xl mt-4 px-4 py-4 font-mono text-sm bg-gray-900 rounded-lg">
								{recoveryCodes.map(code => (
									<div key={code}>{code}</div>
								))}
							</div>
						</div>
					) : null}
				</div>
			) : null}

			<div className="mt-5">
				{twoFactorEnabled || confirming ? (
					<div>
						{confirming ? (
							<ConfirmsPassword onConfirm={confirmTwoFactorAuthentication}>
								<Button
									 type="button"
									className={`mr-3 ${enabling ? 'opacity-25' : ''}`}
									disabled={enabling}
								>
									Confirm
								</Button>
							</ConfirmsPassword>
						) : null}
						{recoveryCodes.length > 0 && !confirming ? (
							<ConfirmsPassword onConfirm={regenerateRecoveryCodes}>
								<Button type="button" theme="secondary" className="mr-3">
									Regenerate Recovery Codes
								</Button>
							</ConfirmsPassword>
						) : null}
						{recoveryCodes.length === 0 && !confirming ? (
							<ConfirmsPassword onConfirm={showRecoveryCodes}>
								<Button type="button" theme="secondary" className="mr-3">
									Show Recovery Codes
								</Button>
							</ConfirmsPassword>
						) : null}

						{confirming ? (
							<ConfirmsPassword onConfirm={disableTwoFactorAuthentication}>
								<Button
									type="button"
									theme="secondary"
									className={`mr-3 ${disabling ? 'opacity-25' : ''}`}
									disabled={disabling}
								>
									Cancel
								</Button>
							</ConfirmsPassword>
						) : (
							<ConfirmsPassword onConfirm={disableTwoFactorAuthentication}>
								<Button
									type="button"
									theme="danger"
									className={`${disabling ? 'opacity-25' : ''}`}
									processing={disabling}
								>
									Disable
								</Button>
							</ConfirmsPassword>
						)}
					</div>
				) : (
					<div>
						<ConfirmsPassword onConfirm={enableTwoFactorAuthentication} onClose={() => setEnabling(false)}>
							<Button
								type="button"
								className={`${enabling ? 'opacity-25' : ''}`}
								processing={enabling}
								onClick={e => setEnabling(true)}
							>
								Enable
							</Button>
						</ConfirmsPassword>
					</div>
				)}
			</div>
		</>
	);
}
