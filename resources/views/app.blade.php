<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>{{ config('app.name', 'Project Lost') }}</title>

		<link rel="stylesheet" href="https://fonts.bunny.net/css2?family=Nunito:wght@400;600;700&display=swap">

		@vite('resources/js/index.tsx')
	</head>
	<body class="font-sans antialiased bg-gray-800">
		<noscript>You need to enable JavaScript to run this app.</noscript>
		<div id="app"></div>
	</body>
</html>