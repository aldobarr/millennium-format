<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CreateBackup extends Command {
	private const THREE_DAYS_IN_SECONDS = 259200;

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

	public function pgSqlBackup(string $user, string $password, string $host, string $port, string $database): void {
		$backup_file_name = date('Y-m-d_H-i-s') . '_backup.dump';
		$temp_file_path = storage_path('backups/' . $backup_file_name);

		try {
			$backups_path = storage_path('backups');
			if (!is_dir($backups_path)) {
				mkdir($backups_path, 0755, true);
			}

			$command = sprintf(
				'PGPASSWORD=%s pg_dump --username=%s --host=%s --port=%s --dbname=%s --file=%s --no-password -F c -Z 3 -c --if-exists',
				escapeshellarg($password),
				escapeshellarg($user),
				escapeshellarg($host),
				escapeshellarg($port),
				escapeshellarg($database),
				escapeshellarg($temp_file_path)
			);

			$result = 0;
			$output = [];
			exec($command, $output, $result);
			if ($result !== 0) {
				$this->error("Failed to create backup. Command output: " . implode("\n", $output));
				return;
			}

			$files = Storage::disk('backups')->files();
			if (count($files) > 3) {
				$now = time();
				foreach ($files as $file) {
					$last_modified = Storage::disk('backups')->lastModified($file);
					if ($now - $last_modified > static::THREE_DAYS_IN_SECONDS) {
						Storage::disk('backups')->delete($file);
					}
				}
			}

			Storage::disk('backups')->put($backup_file_name, file_get_contents($temp_file_path), 'private');
		} finally {
			if (file_exists($temp_file_path)) {
				unlink($temp_file_path);
			}
		}
	}
}
