# MetENP
Metabolite enrichment analysis and their associated enriched pathways.

## Introduction to Enrichment Pipeline

MetENP is a R package that enables detection of significant metabolites from metabolite information 
(names or names and concentration along with metadata information) and provides

1. Enrichment score of metabolite class,
2. Maps to pathway of the species of choice,
3. Calculate enrichment score of pathways,
4. Plots the pathways and shows the metabolite increase or decrease
5. Gets gene info, reaction info, enzyme info

For more info, check out the vignette.
Contact: biosonal@gmail.com; kschoudhary@eng.ucsd.edu


## Installation

Download or clone MetENPAppyter folder from github. Be careful not to overwrite existing folders [create and be in a different folder as needed].
$git clone https://github.com/metabolomicsworkbench/MetENPAppyter.git MetENPAppyter

install.packages("devtools")<br/>
library("devtools")

MetENP package depends on following Bioconductor packages to function properly: KEGGREST, KEGGgraph, pathview and KEGG.db. 
 You may need to install these via:

if (!requireNamespace("BiocManager", quietly = TRUE))<br/>
 install.packages("BiocManager")    <br/>
 BiocManager::install("KEGGREST")<br/>
 BiocManager::install("KEGGgraph")<br/>
 BiocManager::install("pathview")<br/>
 #BiocManager::install("KEGG.db"); # only for BiocManager version < 3.13 <br/>
 
 #### Now proceed with installation
<strong>Through devtools </strong></br>

If you do not have admin priviligages, you can install the packages in the user area, e.g., /home/username/.local/R. Please see detailed instructions in the WORD file included.
  
If above steps gives error:
Install other dependencies and then try installing again: plyr,dplyr,tidyr,purrr,tidygraph,reshape2,ggplot2,ggrepel,
    igraph,ggraph,httr,stringr,jsonlite,rjson,tidyverse,magrittr

#### If you do not wish to install, alternatively, download from github(https://github.com/metabolomicsworkbench/MetENP) and load libraries and functions

suppressMessages(library(plyr))<br/>
suppressMessages(library(dplyr))<br/>
suppressMessages(library(tidyr))<br/>
suppressMessages(library(tidygraph))<br/>
suppressMessages(library(KEGGREST))<br/>
suppressMessages(library(KEGGgraph))<br/>
suppressMessages(library(KEGG.db))<br/>
suppressMessages(library(pathview))<br/>
suppressMessages(library(reshape2))<br/>
suppressMessages(library(ggplot2))<br/>
suppressMessages(library(ggrepel))<br/>
suppressMessages(library(igraph))<br/>
suppressMessages(library(ggraph))<br/>
suppressMessages(library(httr))<br/>
suppressMessages(library(stringr))<br/>
suppressMessages(library(jsonlite))<br/>
suppressMessages(library(rjson))<br/>
suppressMessages(library(tidyverse))<br/>

#### And load all the function with appropriate path (replace 'path' to your own path, e.g., they are inside MetENP_R/MetENP/R relative to the MetENPAppyter folder). 
#### Please note this step is needed only when you do not wish to download or are having difficulty in downloading the package

source('path/compoundinfo.R')<br/>
source('path/anova_ana.R')<br/>
source('path/met_pathways.R')<br/>
source('path/mapspspath.R')<br/>
source('path/metclassenrichment.R')<br/>
source('path/metcountplot.R')<br/>
source('path/getmwstudies.R')<br/>
source('path/path_enrichmentscore.R')<br/>
source('path/pathinfo.R')<br/>
source('path/plot_met_enrichment.R')<br/>
source('path/plot_volcano.R')<br/>
source('path/rxninfo.R')<br/>
source('path/significant_met.R')<br/>
source('path/significant_met_own.R')<br/>
source('path/enzyme_gene_info.R')<br/>
source('path/plot_heatmap.R')<br/>
source('path/plot_pathway_networks.R')<br/>
source('path/react_substrate.R')<br/>
source('path/dotplot_met_class_path.R')<br/>
source('path/convert_refmet.R')<br/>
source('path/map_keggid.R')<br/>
source('path/partial_join.R')<br/>
source('path/getExtension.R')<br/>
source('path/separate_data.R')<br/>

# MetENPAppyter
Please see the detailed instructions below, some of which may be duplicated for continuity. For any questions, please contact: mano@sdsc.edu or susrinivasan@eng.ucsd.edu.

If python package jupyter, R package MetENP and appyter framework are already installed, please follow these steps. To modify the Appyter, edit MetENP_Appyter.ipynb in the MetENPAppyter folder. <br/>
To run the Appyter locally:<br/>
1. source venv/bin/activate<br/>
2. appyter --profile=biojupies --host=123.249.124.012 --port=8080 MetENP_Appyter.ipynb <br/>
3. open the browser link that command gives (i.e., http://123.249.124.012:8080)<br/>

## Detailed instructions 

The syntax of paths is for linux/unix operating system. It can be adjusted for Windows.

<strong>(1)	If one needs to install Jupyter [else ignore this section]</strong></br>

#### This assumes several programs including python3 and some R libraries are already installed and working [see instructions above for MetENP]
[[ for general information only:
#### basic commands: whereis python3 # can check version by starting python3
#### system python packages go to: /usr/lib/python3.9 /usr/lib64/python3.9 [if installed via sudo dnf] /usr/local/lib/python3.9  /usr/local/lib64/python3.9 [if installed via sudo pip3]
#### user/local python typically goes into $HOME/.local/various-folders
#### system R is at /usr/bin/R /usr/lib64/R
#### system R packages go into /usr/lib64/R/library
]]
#### # is comment, $ at start indicate linux command
Be in your home folder, /home/username: 
#### # install jupyter in user area, in the folder /home/username/.local/bunch-of-folders
$pip3 install --user --no-cache-dir jupyter
#### # test it
$ jupyter notebook --ip=your_ip_address_format_123.456.789.012 --port=8080
Go to the page listed, e.g.,
http://123.249.456.789:8080/?token=4228fsdrjh346t3fdgve716452997a25f3e36b0dc2c3f02a3a0aa34
#### # can try to open any existing jupyter notebook if they are in the folder/subfolder
#### # ctrl-C to stop
#### # Install R package IRkernel # need to install R kernel for jupyter in user area; set libloc to user area, e.g., ${HOME}/.local/R if you do not have admin privileges.
#### # start R, being in home area ; > indicates R prompt
$R
>reposlink = 'http://cran.r-project.org'; libloc = "/usr/lib64/R/library/";
>pkgnames = c('IRkernel'); install.packages(pkgnames, repos=reposlink, lib=libloc);
>IRkernel::installspec() # for only current user
>q()
$ls -al .local/share/jupyter/kernels/
see something like this
total 0
drwxrwxr-x. 4 username username  31 Nov  1 00:08 .
drwxrwxr-x. 7 username username 140 Nov  2 10:45 ..
drwxr-xr-x. 2 username username  64 Nov  1 00:08 ir
drwxrwxr-x. 2 username username  69 Oct 27 22:40 python3
 
#### # now jupyter notebooks based on R code should work after you select R kernel after starting jupyter
$ jupyter notebook --ip=123.456.789.012 --port=8080

<strong>(2)	How to Install MetENP R package through R devtools in user area</strong></br>

If already installed, this section can be ignored.
Download or clone MetENPAppyter folder from github. Be careful not to overwrite existing folders [create and be in a different folder as needed].
$git clone https://github.com/metabolomicsworkbench/MetENPAppyter.git MetENPAppyter
The necessary files for installing MetENP R package are located inside the sub-folder MetENP_R inside the MetENPAppyter folder.
#### # install MetENP R package in user area: first copy MetENP from MetENP_R to /home/username/.local folder
$cd ~/.local; mkdir R;
[username@server .local]$cp -R /path-to-MetENPAppyter-folder/MetENP_R/MetENP .

$R
#If devtools is not already installed for all, install it in system R or user R area (see how to set libloc below)
>USER_HOME=Sys.getenv("HOME"); # so that we don’t need to hard code /home/username
>reposlink = 'http://cran.r-project.org'; libloc = paste0(USER_HOME, “/.local/R/");
>#pkgnames = c("devtools"); install.packages(pkgnames, repos=reposlink, lib=libloc);
>library("devtools");
>devtools::install("MetENP", args = paste0("--library=", USER_HOME, "/.local/R")); # for unix local account # uses R CMD INSTALL
>q()
#### # if all went well, this would have installed MetENP in /home/username/.local/R
$ ls -al /home/username/.local/R
 
#### # to check if MetENP can be loaded
$R
#### # modify .libPaths so that it can find R package MetENP
>USER_HOME=Sys.getenv("HOME");
>.libPaths( c( .libPaths(), paste0(USER_HOME, "/.local/R") )); # since MetENP installed in user area, need to include that in path
>library("MetENP") # should load without errors
#### # Now ready to run jupyter, being in a folder containing *.ipynb file, e.g., 
/path-to-MetENPAppyter-folder/
$ jupyter notebook --ip=123.456.789.012 --port=8080
go to webpage listed and open a MetENP jupyter notebook 
Near top in that file, insert the lines, or some of these lines to set .libPaths and load MetENP R library.
>USER_HOME=Sys.getenv("HOME");
>.libPaths( c( .libPaths(), paste0(USER_HOME, "/.local/R") ))
>library("MetENP") # should load without errors
 
<strong>(3)	Appyter</strong></br>

Relevant documentations for appyter framework is provided by Daniel Clarke: </br>
https://github.com/MaayanLab/appyter/blob/master/LICENSE </br>
https://appyters.maayanlab.cloud/#/creating-appyters/  </br>
cd /path-to-MetENPAppyter-folder/</br>
Follow Daniel Clarke’s instruction exactly [as needed, use folder names as per your unix account, project name you want to use, etc] </br>
Introduction to Developing Appyters: https://www.youtube.com/watch?v=IWyjxvDg8JQ  </br>
Look at the script displayed at about 18 minutes in the video. </br>
[username@server MetENPAppyter]$python3 -m venv venv </br>
{</br>
If system python already has many useful packages such as numpy, etc, installed, one can make them available in the venv. Else, later, you might get errors when running the appyter notebook.</br>
https://stackoverflow.com/questions/13992214/how-to-import-a-globally-installed-package-to-virtualenv-folder:  </br>
To be able to use python packages from system installation (global) too, In the virtual environment directory, edit the file pyvenv.cfg. Set the parameter include-system-site-packages = true, and save the file. The globally installed modules will appear the next time you activate (source venv/bin/activate) your environment. 
Do these: </br>
(venv) [username@server MetENPAppyter]$ cd venv/; vi pyvenv.cfg  </br>
# make the change as above </br>
(venv) [username@server MetENPAppyter]$ cd ..; source venv/bin/activate </br>
}</br>

[username@server MetENPAppyter]$source venv/bin/activate  
# to deactivate (so that you can use system python3): simple command: deactivate
(venv) [username@server MetENPAppyter]$echo "git+git://github.com/Maayanlab/appyter.git" >> appyter_requirements.txt 
(venv) [username@server MetENPAppyter]$pip3 install -r appyter_requirements.txt  
(venv) [username@server MetENPAppyter]$which jupyter 
# In the next step, I specify –prefix (so that metenp kernelspec will be installed in ${PWD}/venv/share/jupyter/kernels/ instead of ~/.local/share/jupyter/kernels/). Note that share/jupyter/kernels gets added to path by the program. Thus, this step is slightly different from what is specified in Daniel Clarke’s video 
(venv) [username@server MetENPAppyter]$python -m ipykernel install --prefix=${PWD}/venv/ --name=MetENP 
# check: 
(venv) [username@server MetENPAppyter]$ls -al venv/share/jupyter/kernels/ 
# Since we use R code inside the notebook, we must install rpy2; make sure venv is active 
# Test: make sure the venv python is being used: 
(venv) [username@server MetENPAppyter]$which python3 
##~/appyters/ MetENPAppyter/venv/bin/python3 
## rpy2 installation is not mentioned in Daniel Clarke’s video on appyter
(venv) [username@server MetENPAppyter]$pip3 install rpy2 
Then things are ready: do: The ipynb file is located in the main folder MetENPAppyter, which will likely be /home/username/appyters/ MetENPAppyter if the folder structure suggested above was followed. In the command below, use the IP address of the machine on which MetENPAppyter is installed.
(venv) [username@server MetENPAppyter]$ appyter --profile=biojupies --host=123.249.124.012 --port=8080 MetENP_Appyter.ipynb 
Go to the web page listed (e.g., http:// 123.249.124.012:8080). 
You are all set and ready to use the appyter. To make any edits to the ipynb file (do this only if you understand the appyter framework well), use jupyter command, e.g.,
(venv) [username@server MetENPAppyter]$jupyter notebook --ip=132.249.223.25 --port=8081
Go to the web page listed, and select the ipynb file from the listing to open/run. You may have to edit the paths used for .libPaths and the RData files korg.RData and ls_path.RData. Save after editing, and reload the appyter in the other browser window.
Strongly recommended: make a copy of the original ipynb file and edit the copied file after changing its name suitably.

