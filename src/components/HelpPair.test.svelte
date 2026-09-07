<script>
// Two Help icons for the same term, to exercise the one-panel-at-a-time rule.
import Help from './Help.svelte';

export let term;
</script>

<Help {term} />
<Help {term} />
