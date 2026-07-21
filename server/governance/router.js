import express from 'express';import pool from '../db.js';import core from './workflowCore.cjs';import factory from './routerFactory.cjs';import config from './config.cjs';
const auth=(req,res,next)=>req.user&&req.user.id?next():res.status(401).json({error:'AUTH_CONTEXT_INVALID'});
const db={query:async(s,p)=>(await pool.query(s,p)).rows,transaction:async work=>{const c=await pool.connect();try{await c.query('BEGIN');const result=await work(async(s,p)=>(await c.query(s,p)).rows);await c.query('COMMIT');return result;}catch(error){await c.query('ROLLBACK');throw error;}finally{c.release();}}};
export default factory.createGovernedRouter({express,workflow:core.createWorkflow(config),auth,db});
