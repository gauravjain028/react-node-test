const MeetingHistory = require('../../model/schema/meeting')
const mongoose = require('mongoose');

const add = async (req, res) => {
    try {
        const result = new MeetingHistory(req.body);
        await result.save();
        res.status(200).json(result);
    } catch (err) {
        console.error('Failed to create Meeting:', err);
        res.status(400).json({ error: 'Failed to create Meeting' });
    }
}

const index = async (req, res) => {
    query = req.query;
    query.deleted = false;
    if (query.createBy) {
        query.createBy = new mongoose.Types.ObjectId(query.createBy);
    }

    try {
        let result = await MeetingHistory.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            { $match: { 'users.deleted': false } },
            {
                $addFields: {
                    createdByName: { $concat: ['$users.firstName', ' ', '$users.lastName'] },
                }
            },
            { $project: { users: 0 } },
        ]);
        res.send(result);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
    }
}

const view = async (req, res) => {
    try {
        let response = await MeetingHistory.findOne({ _id: req.params.id })
        if (!response) return res.status(404).json({ message: "no Data Found." })

        console.log('Initial Response:', response);
        console.log('AttendesLead IDs:', response.attendesLead);
        
        try {
            // First, let's check if the Lead exists
            const leadCheck = await mongoose.model('Lead').findOne({ _id: response.attendesLead[0] });
            console.log('Lead Check:', leadCheck);
        } catch (leadErr) {
            console.log('Lead Check Error:', leadErr);
        }

        let result = await MeetingHistory.aggregate([
            { $match: { _id: response._id } },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            {
                $lookup: {
                    from: 'Contacts',
                    let: { contactIds: '$attendes' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ['$_id', '$$contactIds'] }
                            }
                        }
                    ],
                    as: 'attendesConta'
                }
            },
            {
                $lookup: {
                  from: 'Leads',
                  let: { leadIds: '$attendesLead' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $in: ['$_id', '$$leadIds']
                        }
                      }
                    }
                  ],
                  as: 'attendesLead'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    createdByName: { $concat: ['$users.firstName', ' ', '$users.lastName'] }
                }
            },
            { $project: { users: 0 } },
        ]);

        res.status(200).json(result[0]);
    } catch (err) {
        console.log('Error:', err);
        res.status(400).json({ Error: err });
    }
}

const deleteData = async (req, res) => {
    try {
        const result = await MeetingHistory.findByIdAndUpdate(req.params.id, { deleted: true });
        res.status(200).json({ message: "done", result })
    } catch (err) {
        res.status(404).json({ message: "error", err })
    }
}

const deleteMany = async (req, res) => {
    try {
        const result = await MeetingHistory.updateMany({ _id: { $in: req.body } }, { $set: { deleted: true } });

        if (result?.matchedCount > 0 && result?.modifiedCount > 0) {
            return res.status(200).json({ message: "Meetings removed successfully", result });
        }
        else {
            return res.status(404).json({ success: false, message: "Failed to remove meetings" })
        }

    } catch (err) {
        return res.status(404).json({ success: false, message: "error", err });
    }
}

module.exports = { add, index, view, deleteData, deleteMany }
