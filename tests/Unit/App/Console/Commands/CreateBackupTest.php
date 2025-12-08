<?php

namespace Tests\Unit\App\Console\Commands;

use App\Console\Commands\CreateBackup;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CreateBackupTest extends TestCase {
	private string $connection = '';

	protected function setUp(): void {
		parent::setUp();

		$this->connection = config('database.default');
		config(['database.default' => 'pgsql']);

		Storage::expects('disk')->zeroOrMoreTimes()->andReturnSelf();
		Storage::expects('path')->atLeast()->never()->andReturnArg(0);

		// get current test name
		$test_name = $this->name();
		if (!str_contains($test_name, 'create') || !str_contains($test_name, 'directory')) {
			Storage::expects('makeDirectory')->atLeast()->never();
		}
	}

	#[Test]
	public function does_nothing_for_unsupported_db_connection(): void {
		$connection = Mockery::mock(Connection::class);
		$connection->expects('getDriverName')
			->once()
			->andReturn('random-connection');

		DB::expects('connection')
			->once()
			->andReturn($connection);

		$this->artisan('db:backup')
			->expectsOutput("Database driver 'random-connection' is not supported for backups.")
			->assertExitCode(0);
	}

	#[Test]
	public function creates_directory_if_not_exists(): void {
		Process::fake([
			'*' => Process::result(
				errorOutput: 'Some error occurred',
				exitCode: 1,
			),
		]);

		Storage::expects('exists')->twice()->andReturnFalse();
		Storage::expects('makeDirectory')->once()->with('backups');

		$this->artisan('db:backup');
	}

	#[Test]
	public function does_not_create_directory_if_exists(): void {
		Process::fake([
			'*' => Process::result(
				errorOutput: 'Some error occurred',
				exitCode: 1,
			),
		]);

		Storage::expects('exists')->twice()->andReturn(true, false);
		Storage::expects('makeDirectory')->never();

		$this->artisan('db:backup');
	}

	#[Test]
	public function errors_when_dump_command_fails(): void {
		$error = 'Some error occurred';

		Process::fake([
			'*' => Process::result(
				errorOutput: $error,
				exitCode: 1,
			),
		]);

		Storage::expects('exists')->twice()->andReturnFalse();
		Storage::expects('delete')->never();

		$this->artisan('db:backup')
			->expectsOutputToContain('Failed to create backup: ' . $error)
			->assertExitCode(0);
	}

	#[Test]
	public function should_delete_temp_file_on_storage_failures(): void {
		Process::fake([
			'*' => Process::result(exitCode: 0),
		]);

		Storage::expects('files')->once()->andThrow(new \Exception('Storage failure'));
		Storage::expects('exists')->twice()->andReturnTrue();
		Storage::expects('delete')->once();

		$this->expectExceptionMessage('Storage failure');
		$this->artisan('db:backup');
	}

	#[Test]
	public function succeeds_and_does_not_delete_when_less_than_min_number_of_backups_exist(): void {
		Process::fake([
			'*' => Process::result(exitCode: 0),
		]);

		Storage::expects('files')->once()->andReturn(array_fill(0, CreateBackup::MIN_BACKUPS_TO_KEEP - 1, 'backup.dump'));
		Storage::expects('lastModified')->never();
		$this->expectBackupFileUploaded();

		$this->artisan('db:backup')
			->expectsOutputToContain('Backup created successfully')
			->assertExitCode(0);
	}

	#[Test]
	public function succeeds_and_does_not_delete_when_backups_are_newer_than_days_limit(): void {
		Process::fake([
			'*' => Process::result(exitCode: 0),
		]);

		$now = time();
		Storage::expects('files')->once()->andReturn(array_fill(0, CreateBackup::MIN_BACKUPS_TO_KEEP, 'backup.dump'));
		Storage::expects('lastModified')->times(CreateBackup::MIN_BACKUPS_TO_KEEP)->andReturn($now);
		$this->expectBackupFileUploaded();

		$this->artisan('db:backup')
			->expectsOutputToContain('Backup created successfully')
			->assertExitCode(0);
	}

	#[Test]
	public function succeeds_and_deletes_oldest_backup_only(): void {
		Process::fake([
			'*' => Process::result(exitCode: 0),
		]);

		$now = time();
		Storage::expects('files')->once()->andReturn(array_fill(0, CreateBackup::MIN_BACKUPS_TO_KEEP, 'backup.dump'));
		Storage::expects('lastModified')
			->times(CreateBackup::MIN_BACKUPS_TO_KEEP)
			->andReturnValues(array_merge(
				[$now - CreateBackup::TIME_LIMIT_IN_SECONDS - 10],
				array_fill(0, CreateBackup::MIN_BACKUPS_TO_KEEP - 1, $now)
			));

		$this->expectBackupFileUploaded(1);

		$this->artisan('db:backup')
			->expectsOutputToContain('Backup created successfully')
			->assertExitCode(0);
	}

	protected function expectBackupFileUploaded(int $old_backups_to_delete = 0): void {
		// Delete should be called once for the temporary file plus any old backups
		Storage::expects('exists')->twice()->andReturnTrue();
		Storage::expects('delete')->times(1 + $old_backups_to_delete);
		Storage::expects('putFile')->once()->withAnyArgs();
	}

	protected function tearDown(): void {
		config(['database.default' => $this->connection]);

		parent::tearDown();
	}
}
