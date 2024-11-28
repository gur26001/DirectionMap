import { Component,OnInit } from '@angular/core';
import * as L from 'leaflet';
import axios from 'axios';
import 'leaflet-routing-machine';




@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent  implements OnInit{
  private map!:L.Map;
  routing:any;
  cards:L.LatLngExpression[]=[];
  obj:any;

  centroid:L.LatLngExpression= [30.360870,76.417221];

  private GetRoute(startingPoint:any,endingPoint:any){  
    // showing path using Leaflet Routing  
    this.routing = L.Routing.control({
      waypoints: [
        startingPoint,
        endingPoint,
      ],
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
      }),
      routeWhileDragging: true,
      showAlternatives: true,
      
     
    }).addTo(this.map);

  
    // console.log(Reflect.ownKeys(this.routing));


    // console.log(this.routing);
    this.routing.on('routesfound', (e:any) => {
      console.log('Routes found:', e.routes); // List of calculated routes
      this.cards=e.routes[0].coordinates;
      console.log(this.cards);
      console.log('Selected route:', e.selectedRoute); // Should now be accessible
  });

  };

  // private DrawLineBtw(startingPoint:any,endingPoint:any, coordinates:any){
  //    // Showing Line between starting and ending point



  //      //Create a polyline (path) between the two points
  //      const path = L.polyline(coordinates, {
  //       color: 'blue',
  //       weight: 5,
  //       opacity:1
  //     }).addTo(this.map);
      
  //     path.addTo(this.map);

  //     path.bindPopup("This is the highlighted path").openPopup();

   
     
   

  // }

  private initMap(): void {
        this.map = L.map('map', {
          center: this.centroid,
          zoom: 13,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);
        
        
          
      // show mark points
      const startingPoint:L.LatLngExpression= [30.360870,76.417221];
      const endingPoint:L.LatLngExpression=  [30.358850,76.444939];  

      const stMarker=  L.marker( startingPoint);
      const edMarker=  L.marker(endingPoint );
 
      stMarker.addTo(this.map).bindPopup('My House').openPopup();
      edMarker.addTo(this.map).bindPopup('RBH office').openPopup();
    
      this.GetRoute(startingPoint,endingPoint);
      // this.DrawLineBtw(startingPoint,endingPoint,cords);


      const path = L.polyline(
         this.cards,
         {
          color:'green',
          weight:4
         }
      ).addTo(this.map);

      path.addTo(this.map);

   
  }


  //Showing Path(using Overpass api)


  private async FetchRouteBetween():Promise<void>{


    const overpassQuery= `
      [out:json][timeout:25];
      // gather results
      area["name"="Punjab"]->.searchArea;
      (
        nwr["amenity"="college"](area.searchArea);
      );
      // print results
      out geom;
    `;




    const overpassQuery1= `
    [out:json];
    area["name"="Germany"]->.searchArea;
    (
      way["power"="line"](area.searchArea);
      relation["power"="line"](area.searchArea);
    );
    out body;
    >;
    out skel qt;
    `


    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;


    try{
      const response= await axios.get(url);
      const data= response.data;

      // const geoJsonFeatures= this.convertToGeoJSON(data);
      // this.drawRoute(geoJsonFeatures);
      console.log(data);


    }catch(error){
      console.error('Error fetching data from Overpass API:', error);
    };

  }
  private convertToGeoJSON(overpassData: any): any {
    const features = [];
    const nodes: Record<number, [number, number]> = {};

    // Index all nodes
    for (const element of overpassData.elements) {
        if (element.type === 'node') {
            nodes[element.id] = [element.lat, element.lon];
        }
    }

    console.log('Indexed Nodes:', nodes);

    // Create GeoJSON features for ways and relations
    for (const element of overpassData.elements) {
        if (element.type === 'way' && element.nodes) {
            const coordinates = element.nodes.map((nodeId: number) => nodes[nodeId]);
            if (coordinates.every((coord:[number,number]) => coord)) {
                features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates.map((coord: [number, number]) => [coord[1], coord[0]]), // lon/lat
                    },
                    properties: element.tags,
                });
            } else {
                console.warn('Missing nodes for way:', element.nodes);
            }
        }

        if (element.type === 'relation' && element.members) {
            // Process relation members (e.g., ways part of a relation)
            const relationCoordinates = [];
            for (const member of element.members) {
                if (member.type === 'way' && nodes[member.ref]) {
                    const nodeCoordinates = member.nodes?.map((nodeId: number) => nodes[nodeId]) || [];
                    relationCoordinates.push(...nodeCoordinates);
                }
            }
            if (relationCoordinates.length) {
                features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'MultiLineString',
                        coordinates: relationCoordinates.map((coord: [number, number]) => [coord[1], coord[0]]),
                    },
                    properties: element.tags,
                });
            }
        }
    }

    console.log('GeoJSON Features:', features);

    return {
        type: 'FeatureCollection',
        features: features,
    };
}


    private drawRoute(geoJsonData: any): void {
      // Add the GeoJSON data as a layer to the map
      L.geoJSON(geoJsonData, {
        style: {
          color: 'blue',
          weight: 4
        }
      }).addTo(this.map);


  }

  


  constructor(){}

  ngOnInit(): void {
    this.initMap();
  }


}
