# Inline Service Check - No Script Required

**Just copy and paste this into your browser console:**

```javascript
(function() {
  console.log('\n🔍 Unified Services Check\n');
  console.log('═'.repeat(50));
  
  const services = [
    { name: 'ContextOptimizer', obj: window.contextOptimizer },
    { name: 'ContextPredictor', obj: window.contextPredictor },
    { name: 'ContextManager', obj: window.contextManager },
    { name: 'PrimaryNarrativeEngine', obj: window.primaryNarrativeEngine },
    { name: 'AdvancedNarrativeEngine', obj: window.advancedNarrativeEngine },
    { name: 'UnifiedSystemIntegration', obj: window.unifiedSystemIntegration }
  ];

  let loaded = 0;
  let failed = 0;

  services.forEach(service => {
    const status = !!service.obj;
    const icon = status ? '✅' : '❌';
    const type = service.obj ? typeof service.obj : 'undefined';
    const methods = service.obj ? Object.keys(service.obj).filter(k => typeof service.obj[k] === 'function').length : 0;
    
    console.log(`${icon} ${service.name.padEnd(30)} ${status ? 'LOADED' : 'MISSING'} (${type}, ${methods} methods)`);
    
    if (status) {
      loaded++;
    } else {
      failed++;
      // Check if file might have loaded but failed to initialize
      const lowerName = service.name.charAt(0).toLowerCase() + service.name.slice(1);
      console.log(`   └─ window.${lowerName} is ${typeof window[lowerName]}`);
    }
  });

  console.log('═'.repeat(50));
  console.log(`\n📊 Result: ${loaded}/6 services loaded`);
  
  if (loaded === 6) {
    console.log('✅ All services are loaded and ready!');
  } else if (loaded > 0) {
    console.log(`⚠️  ${failed} service(s) failed to load.`);
    console.log('\n💡 Check:');
    console.log('   1. Network tab for 404 errors');
    console.log('   2. Console for JavaScript errors');
    console.log('   3. Look for initialization messages like:');
    console.log('      [ContextOptimizer] ✅ Initialized');
  } else {
    console.log('❌ No services loaded.');
    console.log('\n💡 Possible issues:');
    console.log('   1. Files not loading (check Network tab)');
    console.log('   2. JavaScript errors (check Console)');
    console.log('   3. Script loading order issue');
    console.log('   4. Files don\'t exist on server');
  }

  return { loaded, failed, total: 6 };
})();
```

---

## 🚀 **Quick Copy-Paste Version**

Just paste this one-liner:

```javascript
(function(){const s=[{n:'ContextOptimizer',o:window.contextOptimizer},{n:'ContextPredictor',o:window.contextPredictor},{n:'ContextManager',o:window.contextManager},{n:'PrimaryNarrativeEngine',o:window.primaryNarrativeEngine},{n:'AdvancedNarrativeEngine',o:window.advancedNarrativeEngine},{n:'UnifiedSystemIntegration',o:window.unifiedSystemIntegration}];let l=0,f=0;console.log('\n🔍 Unified Services Check\n','═'.repeat(50));s.forEach(s=>{const st=!!s.o;const i=st?'✅':'❌';const t=s.o?typeof s.o:'undefined';const m=s.o?Object.keys(s.o).filter(k=>typeof s.o[k]==='function').length:0;console.log(`${i} ${s.n.padEnd(30)} ${st?'LOADED':'MISSING'} (${t}, ${m} methods)`);if(st)l++;else{f++;const ln=s.n.charAt(0).toLowerCase()+s.n.slice(1);console.log(`   └─ window.${ln} is ${typeof window[ln]}`);}});console.log('═'.repeat(50),`\n📊 Result: ${l}/6 services loaded`);if(l===6)console.log('✅ All services loaded!');else if(l>0)console.log(`⚠️  ${f} service(s) failed. Check Network/Console tabs.`);else console.log('❌ No services loaded. Check Network tab for 404 errors.');return{l,f,t:6};})();
```

---

**Just paste either version into your browser console!**

