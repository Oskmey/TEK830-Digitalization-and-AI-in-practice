<script>
	export let greetings;
</script>

<main class="flex flex-col items-center justify-center h-screen w-screen bg-neutral-900 text-white">
	<div class="p-10 border border-red-500 rounded-lg hover:bg-black">
		<h1 class="text-3xl text-red-500 font-bold tracking-tight text-center mb-5">
			{greetings} from
			{document.data.name}
		</h1>
		<p class=" font-title">TEST</p>
	</div> 
</main>

<style global lang="postcss">
	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
	@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
</style>
