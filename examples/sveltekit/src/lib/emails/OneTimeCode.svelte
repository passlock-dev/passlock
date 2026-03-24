<script lang="ts">
	let { firstName, code }: { firstName: string; code: string } = $props();
</script>

Dear {firstName},
<br />
Here is your one-time code: {code}
