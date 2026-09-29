import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createCompatibility } from './compat.mjs';

test('device quantity never limits shops; shop ownership and subscription checks remain', t => {
  const db = new DatabaseSync(':memory:');t.after(()=>db.close());
  db.exec('PRAGMA foreign_keys=ON; CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users VALUES(1),(2);');
  const time=1790000000000,compat=createCompatibility(db,()=>time);
  const user={id:1,disabled:0,expires:time+86400000,shops:1,device_limit:1};
  const created=[];
  for(let index=0;index<20;index++)created.push(compat(user,{url:'/cline/shop',method:'post',data:{platformType:'4',platformShopId:'shop-'+index,shopName:'Shop '+index}}));
  assert.equal(compat(user,{url:'/cline/shop/Alllist'}).length,20);
  assert.equal(compat(user,{url:'/cline/shop',method:'put',data:{id:created[19].id,shopName:'Renamed'}}).shopName,'Renamed');
  assert.throws(()=>compat(user,{url:'/cline/shop',method:'post',data:{platformType:'4',platformShopId:'shop-0'}}),error=>error.status===409);
  assert.throws(()=>compat({...user,id:2},{url:'/cline/shop/'+created[0].id}),error=>error.status===404);
  assert.throws(()=>compat({...user,expires:time},{url:'/cline/shop',method:'post',data:{platformShopId:'expired'}}),error=>error.status===403);
  assert.throws(()=>compat({...user,disabled:1},{url:'/cline/shop/Alllist'}),error=>error.status===403);
  assert.equal(compat({...user,id:2},{url:'/cline/shop/Alllist'}).length,0);
});
