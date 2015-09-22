# eENVplus TFES cluster visualization

This cluster visualization intends to visualize contents exploited by the Thesaurus Framework Exploitation Services [TFES](https://github.com/eENVplus/tf-exploitation-server). It provides an interactive user interface which can be used to perform a so-called "Semantic Explorative Search (SES)".

Due to the cascading hierarchical structure of the semantic information represented in a SKOS constellation, pinpointing the right concept, which precisely addresses the aimed definition, can be a challenging task. This can, however, be facilitated by the use of the hierarchical nature of the semantic data and generation of an interactive visualization of this hierarchy. The user will then be able to explore through the hierarchy and fine-tune his selection by going through the more general concept and find his precise concept under the narrower concepts of the abstract concept.

This document describes the configuration and usage of the visualization tool.

## License

TFES cluster visualization is licensed under the [Apache Licence 2.0](https://www.apache.org/licenses/LICENSE-2.0).

## Usage

### Deployment

The repository content is a small set of files:
* ```index.html``` Contains the HTML-Frame for the visualization components, applies CSS stylesheets
* ```d3.min.js```, ```d3tip.js``` Minimized version of the [D3.js](http://d3js.org/) library
* ```eENVplus_cluster_script.js``` Java Script implementation of the cluster visualization

These files have to be deployed to an arbitrary HTTP webserver. Check availability by calling
the appropriate URL, e.g. http://localhost:8000/visualization

### Configuration

The visualization depends on the availability of a Thesaurus Framework Exploitation Service (TFES)
REST endpoint. Therefore an URL to this endpoint has to be configured.

Edit the file ```index.html``` and adapt to following line to an URL to your TFES REST endpoint in your environment:
```
eENVplusCluster.init({
  //[...]
  baseUrl: "http://localhost:8085/tfes/rest/",
  //[...]
});
```

### User interface

To use the cluster visualization the webpage of your webserver in one of the current Browsers
(Firefox, Chrome, etc.) according to the following request pattern:
```
http://<hostname>:<port>/<application>/?type=cluster&focusConcept=<conceptURI>&k=<depth>&languages=<listOfLanguages>&relations=<listOfRelationTypes>
```

Request examples:

* [http://linkeddata.ge.imati.cnr.it/visualization/?type=cluster&focusConcept=http://eurovoc.europa.eu/1169&languages=en&k=2&relations=](http://linkeddata.ge.imati.cnr.it/visualization/?type=cluster&focusConcept=http://eurovoc.europa.eu/1169&languages=en&k=2&relations=)
* [linkeddata.ge.imati.cnr.it/visualization/?type=cluster&focusConcept=http://linkeddata.ge.imati.cnr.it/resource/EARTh/19250&languages=en&k=2&relations=broader,narrower](linkeddata.ge.imati.cnr.it/visualization/?type=cluster&focusConcept=http://linkeddata.ge.imati.cnr.it/resource/EARTh/19250&languages=en&k=2&relations=broader,narrower)
* [http://linkeddata.ge.imati.cnr.it/visualization/?type=cluster&focusConcept=http://linkeddata.ge.imati.cnr.it/resource/INSPIREThemeRegister/lc&languages=en&k=2&relations=](http://linkeddata.ge.imati.cnr.it/visualization/?type=cluster&focusConcept=http://linkeddata.ge.imati.cnr.it/resource/INSPIREThemeRegister/lc&languages=en&k=2&relations=)

The visualization initially shows an overview around the given focusConcept using the given depth, languages and relations to other keyword concepts.

The visualization offers the following features:
* Drag and zoom
* Hover keyword concepts to get detailed information about the keyword concept and its relation to other concepts in the visualization
* Different relations are represented by different edge colors
* Different originating thesauri are represented by different node colors
* Enable a legend overlay to get information about node and edge colors by clicking the ```?``` sign.
* Use the legend panel to choose for a set of relations to be visualized
* Hover keyword concepts to call the LusTRE interface by clicking the ```>``` sign shown next to the concept node
* Navigate to another keyword concept by clicking on its node
* Go back and forward in visualization history by using the ```<``` ```>``` buttons on the top left corner

## Contribute

Feel free to contribute! :-)
