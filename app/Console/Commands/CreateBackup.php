<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Encryption\EncryptionServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

class CreateBackup extends Command {
	public const TIME_LIMIT_IN_SECONDS = 259200; // 3 days
	public const MIN_BACKUPS_TO_KEEP = 3;

	/**
	 * The name and signature of the console command.
	 *
	 * @var string
	 */
	protected $signature = 'db:backup';

	/**
	 * The console command description.
	 *
	 * @var string
	 */
	protected $description = 'Creates a backup of the database in its current state and deletes backups older than 3 days.';

	/**
	 * Execute the console command.
	 */
	public function handle(): void {
		$connection = DB::connection()->getDriverName();
		$db_user = config("database.connections.{$connection}.username");
		$db_password = config("database.connections.{$connection}.password");
		$db_host = config("database.connections.{$connection}.host");
		$db_port = config("database.connections.{$connection}.port");
		$db_name = config("database.connections.{$connection}.database");

		switch ($connection) {
			case 'pgsql':
				$this->pgSqlBackup($db_user, $db_password, $db_host, $db_port, $db_name);
				break;
			default:
				$this->error("Database driver '{$connection}' is not supported for backups.");
				break;
		}
	}

	protected function pgSqlBackup(string $user, string $password, string $host, string $port, string $database): void {
		$backup_file_name = date('Y-m-d_H-i-s') . '_backup.dump';
		$temp_file_path = Storage::disk('local')->path('backups/' . $backup_file_name);

		try {
			if (!Storage::disk('local')->exists('backups')) {
				Storage::disk('local')->makeDirectory('backups');
			}

			$command = sprintf(
				'pg_dump --username=%s --host=%s --port=%s --dbname=%s --file=%s --no-password -F c -Z 3 -c --if-exists',
				escapeshellarg($user),
				escapeshellarg($host),
				escapeshellarg($port),
				escapeshellarg($database),
				escapeshellarg($temp_file_path)
			);

			$result = Process::env(['PGPASSWORD' => $password])->run($command);
			if ($result->failed()) {
				$this->error('Failed to create backup: ' . $result->errorOutput());
				return;
			}

			$files = Storage::disk('backups')->files();
			if (count($files) >= static::MIN_BACKUPS_TO_KEEP) {
				$now = time();
				foreach ($files as $file) {
					$last_modified = Storage::disk('backups')->lastModified($file);
					if ($now - $last_modified > static::TIME_LIMIT_IN_SECONDS) {
						Storage::disk('backups')->delete($file);
					}
				}
			}

			Storage::disk('backups')->putFile('', $temp_file_path, 'private');
			$this->info('Backup created successfully: ' . $backup_file_name);
		} finally {
			if (Storage::disk('local')->exists('backups/' . $backup_file_name)) {
				Storage::disk('local')->delete('backups/' . $backup_file_name);
			}
		}
	}

	protected function parseKey(string $key): string {
		$provider = new EncryptionServiceProvider(app());
		$reflection = new \ReflectionClass($provider);
		$method = $reflection->getMethod('parseKey');
		return $method->invoke($provider, ['key' => $key]);
	}
}
