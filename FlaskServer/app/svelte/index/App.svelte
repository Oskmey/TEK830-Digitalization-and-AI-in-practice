<script>

</script>

<div class="flex h-screen w-screen">
	<nav class="w-1/5 h-screen bg-dark-200 text-white p-4">
		<ul>
		  <li class="mb-4"><a href="#home" class="hover:underline">Home</a></li>
		  <li class="mb-4"><a href="#about" class="hover:underline">About</a></li>
		  <li class="mb-4"><a href="#services" class="hover:underline">Services</a></li>
		  <li class="mb-4"><a href="#contact" class="hover:underline">Contact</a></li>
		</ul>
	</nav>

	<main class="flex items-center justify-center h-full w-full bg-black text-white font-body">
		<button class="px-16 py-24 bg-dark-200 border border-white rounded-lg transition ease-in-out hover:bg-dark-300">
			<h1 class="text-3xl text-red-500 font-bold tracking-tight text-center mb-5">Click to add image</h1>
			<p class="text-xs">The image should contain your product with a white background</p>
		</button> 
	</main>
</div>


<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>
