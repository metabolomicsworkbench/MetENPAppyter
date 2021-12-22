<script>
  import StudySelectField from './StudySelectField.svelte'
  import ChoiceField from './ChoiceField.svelte'

  // export let window
  export let args
  console.log(args.value)

  let applicable_factors
  let applicable_analysis
  let applicable_fac_colnames

    // use this instead of Object.values 
    // MW REST return like {"study_id":....}a if only one analysisand but {1:{},2:{}} if more than one analysis type
    function ensureListOfStudies(data) { 
        if ('study_id' in data) { return [data] }
        else { return Object.values(data) }
    }
</script>

<div class="row px-4 px-lg-3 pb-4">
  <div class="col-lg-3 bold text-lg-right my-auto">
    {args.label}{#if args.description}<sup data-toggle="tooltip" title={args.description}><i class="far fa-question-circle"></i></sup>{/if}:
  </div>
  <div class="col-lg-6 pt-2 pt-lg-0">


Study ID: <StudySelectField bind:value={args.value.study_id} />
<br />
<!-- ////////////////////////////////////////////////////////////////////////////////////////////////// -->
{#if applicable_factors}
Analysis: <ChoiceField bind:value={args.value.anal} choices={applicable_analysis} /><br>
Factor Column Name: <ChoiceField bind:value={args.value.faccol} choices={applicable_fac_colnames} /><br>
Factor 1: <ChoiceField bind:value={args.value.fac1} choices={applicable_factors} /><br>
Factor 2: <ChoiceField bind:value={args.value.fac2} choices={applicable_factors} />
{:else}
<a
 href="javascript:"
 class="btn btn-sm btn-primary"
 on:click={async () => {
    // TODO: resolve applicable  analysis and factors
    const analysis_url = 'https://www.metabolomicsworkbench.org/rest/study/study_id/' + args.value.study_id  + '/analysis/';
    const res_anal = await fetch(analysis_url)
    const data_anal = await res_anal.json()
    const study_anal = new Set();
    //Object.values(data_anal).forEach(({ analysis_summary }) => study_anal.add(analysis_summary));
    ensureListOfStudies(data_anal).forEach(({ analysis_summary }) => study_anal.add(analysis_summary));

    // 12/20/2021: add the combined analysis string as another element
    // use ___ as a separator for multiple analysis types; also in the ipynb file for the appyter (not anywhere else)
    const analysis_type_sep = "___";
    //const combined_str = "All analysis together";
    //const combined_str = "Core G Fatty acids/Eicosanoids___Core J Sterols___Core K Prenols/Cardiolipins___Core E Neutral Lipids___Core I Sphingolipids___Core H Phospholipids";
    // https://stackoverflow.com/questions/47243139/how-to-convert-set-to-string-with-space
    const combined_str = Array.from(study_anal).join(analysis_type_sep);

    study_anal.add(combined_str);

    applicable_analysis = [...study_anal];

    const factors_url = 'https://www.metabolomicsworkbench.org/rest/study/study_id/' + args.value.study_id  + '/factors/'
    const res = await fetch(factors_url)
    const data = await res.json()
    const study_factors = new Set()
    const study_fac_colnames = new Set()
    // in python: factors_unq = list(np.unique(np.array(factors_df['factors'].tolist())))
    // factors in { } refers to the factors field in the json object, which is, data
    // explanation: [{hello: "hi"}, {hello: "Mano"}].map(({hello}) => hello) == ["hi", "Mano"]
    // explanation: data.forEach((datum) => factors.add(datum.factors))
    // {(console.log(data), '')}
    Object.values(data).forEach(({ factors }) => study_factors.add(factors.split(":")[1]))
    Object.values(data).forEach(({ factors }) => study_fac_colnames.add(factors.split(":")[0]))
    applicable_factors = [...study_factors]
    applicable_fac_colnames = [...study_fac_colnames]
  }}
>Resolve Analysis and Factors</a>
{/if}
<br />
  </div>
</div>

<!-- TODO: hide this field in production -->
<textarea readonly name={args.name} type="text" style="display: none"  value={JSON.stringify(args.value)} /> 
