export default class Utility {

    static loadResource(srcPath) {
        return new Promise( ( resolve, reject ) => {
            fetch( srcPath )
                .then( ( res ) => {
                    return res.text();
                } )
                .then( ( text ) => {
                    resolve( text );
                } )
                .catch( ( err ) => {
                    reject( err );
                } );
        } );
    }
    static lerp( start, end, multiplier ) {
        return (1 - multiplier) * start + multiplier * end;
    }

    static offset( $target,s ){
        if(s === undefined){
            s = 0;
        }
        const rect = $target.getBoundingClientRect();
        const scrollTop = s;

        return {
            top: rect.top + scrollTop,
            left: rect.left
        };
    }
}