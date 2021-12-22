<script>
  export let value
  export let choices = []
</script>

<select bind:value={value}>
  {#each choices as choice}
    <option value={choice}>{choice}</option>
  {/each}
</select>
